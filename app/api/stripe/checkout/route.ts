import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe";
import { requireAuth, apiHandler } from "@/lib/api-utils";

export const POST = apiHandler(async (req) => {
  const [session, err] = await requireAuth();
  if (err) return err;

  const { priceId } = await req.json();

  if (!priceId) {
    return NextResponse.json(
      { error: "Price ID is required" },
      { status: 400 }
    );
  }

  const checkoutSession = await createCheckoutSession(
    session.user.id,
    priceId
  );

  return NextResponse.json({ url: checkoutSession.url });
});
