import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateWorkspaceSchema } from "@/lib/validation";
import { requireAuth, apiHandler } from "@/lib/api-utils";

export const GET = apiHandler(async (_req, { params }) => {
  const [session, err] = await requireAuth();
  if (err) return err;

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
});

export const PATCH = apiHandler(async (req, { params }) => {
  const [session, err] = await requireAuth();
  if (err) return err;

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
});

export const DELETE = apiHandler(async (_req, { params }) => {
  const [session, err] = await requireAuth();
  if (err) return err;

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

  await db.workspace.delete({ where: { id: params.workspaceId } });

  return NextResponse.json({ ok: true });
});
