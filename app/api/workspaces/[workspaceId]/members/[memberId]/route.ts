import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE - remove a member from workspace
export async function DELETE(
  _req: Request,
  { params }: { params: { workspaceId: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check requester is admin/owner
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

    // Find the member to remove
    const target = await db.member.findUnique({
      where: { id: params.memberId },
    });

    if (!target || target.workspaceId !== params.workspaceId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Can't remove the owner
    if (target.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot remove the workspace owner" },
        { status: 403 }
      );
    }

    // Admins can't remove other admins (only owners can)
    if (target.role === "ADMIN" && requester.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only the owner can remove admins" },
        { status: 403 }
      );
    }

    await db.member.delete({ where: { id: params.memberId } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
