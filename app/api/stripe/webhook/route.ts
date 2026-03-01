import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, handleSubscriptionChange } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendBillingAlert } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(
        subscription.id,
        subscription.customer as string
      );
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(
        subscription.id,
        subscription.customer as string
      );

      // Notify user
      const deletedUser = await db.user.findUnique({
        where: { stripeCustomerId: subscription.customer as string },
      });
      if (deletedUser?.email) {
        await sendBillingAlert(deletedUser.email, "subscription_canceled");
      }
      break;
    }

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        await handleSubscriptionChange(
          session.subscription as string,
          session.customer as string
        );
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      // Find user and notify them
      const failedUser = await db.user.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (failedUser?.email) {
        await sendBillingAlert(failedUser.email, "payment_failed");
        console.error(
          `Payment failed for ${failedUser.email} (${customerId}), notification sent`
        );
      } else {
        console.error(
          `Payment failed for unknown customer ${customerId}`,
          invoice.id
        );
      }
      break;
    }

    case "customer.subscription.trial_will_end": {
      const subscription = event.data.object as Stripe.Subscription;
      const trialUser = await db.user.findUnique({
        where: { stripeCustomerId: subscription.customer as string },
      });

      if (trialUser?.email) {
        await sendBillingAlert(trialUser.email, "trial_ending");
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
