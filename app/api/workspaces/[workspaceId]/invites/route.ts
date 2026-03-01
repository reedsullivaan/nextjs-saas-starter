import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendInviteEmail } from "@/lib/email";
import { inviteSchema } from "@/lib/validation";

export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user is admin or owner of workspace
    const member = await db.member.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: params.workspaceId,
        },
      },
    });

    if (!member || member.role === "MEMBER") {
      return NextResponse.json(
        { error: "Only admins and owners can invite members" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;

    // Check if already a member
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await db.member.findUnique({
        where: {
          userId_workspaceId: {
            userId: existingUser.id,
            workspaceId: params.workspaceId,
          },
        },
      });
      if (existingMember) {
        return NextResponse.json(
          { error: "This person is already a member" },
          { status: 409 }
        );
      }
    }

    // Check for existing pending invite
    const existingInvite = await db.invite.findFirst({
      where: {
        email,
        workspaceId: params.workspaceId,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "An invite has already been sent to this email" },
        { status: 409 }
      );
    }

    // Create invite (expires in 7 days)
    const invite = await db.invite.create({
      data: {
        email,
        role: role as "ADMIN" | "MEMBER",
        workspaceId: params.workspaceId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Get workspace name for email
    const workspace = await db.workspace.findUnique({
      where: { id: params.workspaceId },
    });

    // Send invite email
    try {
      await sendInviteEmail(
        email,
        session.user.name || session.user.email || "Someone",
        workspace?.name || "a workspace",
        invite.token
      );
    } catch (emailError) {
      console.error("Failed to send invite email:", emailError);
      // Don't fail the invite if email fails
    }

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
