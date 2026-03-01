import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, slug } = await req.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug can only contain lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await db.workspace.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "This workspace URL is already taken" },
        { status: 409 }
      );
    }

    // Create workspace with user as owner
    const workspace = await db.workspace.create({
      data: {
        name,
        slug,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
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
            members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
          },
        },
      },
    });

    return NextResponse.json(
      workspaces.map((m) => ({
        ...m.workspace,
        role: m.role,
      }))
    );
  } catch (error) {
    console.error("Workspace fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
