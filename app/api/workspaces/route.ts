import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workspaceSchema } from "@/lib/validation";
import { requireAuth, apiHandler } from "@/lib/api-utils";

export const POST = apiHandler(async (req) => {
  const [session, err] = await requireAuth();
  if (err) return err;

  const body = await req.json();
  const parsed = workspaceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { name, slug } = parsed.data;

  const existing = await db.workspace.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "This workspace URL is already taken" },
      { status: 409 }
    );
  }

  const workspace = await db.workspace.create({
    data: {
      name,
      slug,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
    include: { members: true },
  });

  return NextResponse.json(workspace, { status: 201 });
});

export const GET = apiHandler(async () => {
  const [session, err] = await requireAuth();
  if (err) return err;

  const workspaces = await db.member.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(
    workspaces.map((m) => ({ ...m.workspace, role: m.role }))
  );
});
