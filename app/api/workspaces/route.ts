import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { workspaceSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
  } catch (error) {
    console.error("Workspace creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
  } catch (error) {
    console.error("Workspace fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
