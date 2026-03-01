import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateWorkspaceSchema } from "@/lib/validation";

// GET workspace by ID
export async function GET(
  _req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await db.workspace.findUnique({
      where: { id: params.workspaceId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        invites: { where: { expiresAt: { gt: new Date() } } },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isMember = workspace.members.some((m) => m.user.id === session.user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(workspace);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - update workspace name
export async function PATCH(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await db.member.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: params.workspaceId,
        },
      },
    });

    if (!member || member.role === "MEMBER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const workspace = await db.workspace.update({
      where: { id: params.workspaceId },
      data: { name: parsed.data.name },
    });

    return NextResponse.json(workspace);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - delete workspace (owner only)
export async function DELETE(
  _req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await db.member.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: params.workspaceId,
        },
      },
    });

    if (!member || member.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only the workspace owner can delete it" },
        { status: 403 }
      );
    }

    // Delete workspace and all related data (cascading deletes in schema)
    await db.workspace.delete({ where: { id: params.workspaceId } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
