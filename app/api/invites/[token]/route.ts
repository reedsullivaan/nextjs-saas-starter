import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const invite = await db.invite.findUnique({
      where: { token: params.token },
      include: { workspace: { select: { name: true } } },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      email: invite.email,
      workspaceName: invite.workspace.name,
      role: invite.role,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
