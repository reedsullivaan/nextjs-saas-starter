import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateUserSchema } from "@/lib/validation";
import { requireAuth, apiHandler } from "@/lib/api-utils";

export const GET = apiHandler(async () => {
  const [session, err] = await requireAuth();
  if (err) return err;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
  });

  return NextResponse.json(user);
});

export const PATCH = apiHandler(async (req) => {
  const [session, err] = await requireAuth();
  if (err) return err;

  const body = await req.json();
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(user);
});

export const DELETE = apiHandler(async () => {
  const [session, err] = await requireAuth();
  if (err) return err;

  const ownedWorkspaces = await db.member.findMany({
    where: { userId: session.user.id, role: "OWNER" },
  });

  if (ownedWorkspaces.length > 0) {
    return NextResponse.json(
      {
        error:
          "You must delete or transfer ownership of your workspaces before deleting your account",
      },
      { status: 400 }
    );
  }

  await db.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ ok: true });
});
