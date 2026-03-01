import Stripe from "stripe";
import { db } from "./db";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
});

export async function createCheckoutSession(
  userId: string,
  priceId: string
): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: user.name || undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await db.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    subscription_data: {
      trial_period_days: 14,
    },
  });

  return session.url!;
}

export async function createPortalSession(customerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
  });
  return session.url;
}

export async function handleSubscriptionChange(
  subscriptionId: string,
  customerId: string
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const user = await db.user.findUnique({
    where: { stripeCustomerId: customerId },
    include: { members: { include: { workspace: true } } },
  });

  if (!user) return;

  const workspace = user.members.find((m) => m.role === "OWNER")?.workspace;
  if (!workspace) return;

  await db.workspace.update({
    where: { id: workspace.id },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(
        subscription.current_period_end * 1000
      ),
      plan:
        subscription.status === "active" ||
        subscription.status === "trialing"
          ? "PRO"
          : "FREE",
    },
  });
}
