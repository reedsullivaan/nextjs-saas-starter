import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, apiHandler } from "@/lib/api-utils";

export const DELETE = apiHandler(async (_req, { params }) => {
  const [session, err] = await requireAuth();
  if (err) return err;

  const requester = await db.member.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId: params.workspaceId,
      },
    },
  });

  if (!requester || requester.role === "MEMBER") {
    return NextResponse.json(
      { error: "Only admins and owners can remove members" },
      { status: 403 }
    );
  }

  const target = await db.member.findUnique({
    where: { id: params.memberId },
  });

  if (!target || target.workspaceId !== params.workspaceId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (target.role === "OWNER") {
    return NextResponse.json(
      { error: "Cannot remove the workspace owner" },
      { status: 403 }
    );
  }

  if (target.role === "ADMIN" && requester.role !== "OWNER") {
    return NextResponse.json(
      { error: "Only the owner can remove admins" },
      { status: 403 }
    );
  }

  await db.member.delete({ where: { id: params.memberId } });

  return NextResponse.json({ ok: true });
});
