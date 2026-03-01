import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler } from "@/lib/api-utils";

export const GET = apiHandler(async (_req, { params }) => {
  const invite = await db.invite.findUnique({
    where: { token: params.token },
    include: {
      workspace: { select: { name: true, slug: true } },
    },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    workspace: invite.workspace,
  });
});
