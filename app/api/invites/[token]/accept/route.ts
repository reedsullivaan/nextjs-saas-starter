import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invite = await db.invite.findUnique({
      where: { token: params.token },
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

    // Check if already a member
    const existing = await db.member.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: invite.workspaceId,
        },
      },
    });

    if (existing) {
      // Delete the invite and redirect
      await db.invite.delete({ where: { id: invite.id } });
      return NextResponse.json({ ok: true, alreadyMember: true });
    }

    // Add user to workspace and delete invite in a transaction
    await db.$transaction([
      db.member.create({
        data: {
          userId: session.user.id,
          workspaceId: invite.workspaceId,
          role: invite.role,
        },
      }),
      db.invite.delete({ where: { id: invite.id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
