import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createPortalSession } from "@/lib/stripe";
import { requireAuth, apiHandler } from "@/lib/api-utils";

export const POST = apiHandler(async () => {
  const [session, err] = await requireAuth();
  if (err) return err;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found. Upgrade to a paid plan first." },
      { status: 400 }
    );
  }

  const portalSession = await createPortalSession(user.stripeCustomerId);

  return NextResponse.json({ url: portalSession.url });
});
