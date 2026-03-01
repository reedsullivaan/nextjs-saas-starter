import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, apiHandler } from "@/lib/api-utils";

export const POST = apiHandler(async (_req, { params }) => {
  const [session, err] = await requireAuth();
  if (err) return err;

  const invite = await db.invite.findUnique({
    where: { token: params.token },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  // Check if already a member
  const existingMember = await db.member.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId: invite.workspaceId,
      },
    },
  });

  if (existingMember) {
    // Delete the invite since they're already a member
    await db.invite.delete({ where: { id: invite.id } });
    return NextResponse.json(
      { error: "You are already a member of this workspace" },
      { status: 409 }
    );
  }

  // Accept invite in a transaction: create member + delete invite
  await db.$transaction([
    db.member.create({
      data: {
        userId: session.user.id,
        workspaceId: invite.workspaceId,
        role: invite.role as "ADMIN" | "MEMBER",
      },
    }),
    db.invite.delete({ where: { id: invite.id } }),
  ]);

  return NextResponse.json({ ok: true, workspaceId: invite.workspaceId });
});
