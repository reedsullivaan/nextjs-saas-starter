import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, apiHandler } from "@/lib/api-utils";

export const GET = apiHandler(async (_req, { params }) => {
  const [session, err] = await requireAuth();
  if (err) return err;

  const workspace = await db.workspace.findUnique({
    where: { slug: params.slug },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      invites: { where: { expiresAt: { gt: new Date() } } },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const member = workspace.members.find((m) => m.user.id === session.user.id);
  if (!member) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json({ ...workspace, role: member.role });
});
