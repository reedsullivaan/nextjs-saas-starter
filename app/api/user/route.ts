import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateUserSchema } from "@/lib/validation";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true, createdAt: true },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user owns any workspaces — they must transfer or delete those first
    const ownedWorkspaces = await db.member.findMany({
      where: { userId: session.user.id, role: "OWNER" },
    });

    if (ownedWorkspaces.length > 0) {
      return NextResponse.json(
        {
          error:
            "You must delete or transfer ownership of your workspaces before deleting your account",
        },
        { status: 400 }
      );
    }

    // Delete user (cascading deletes handle memberships, sessions, accounts)
    await db.user.delete({ where: { id: session.user.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("User delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
