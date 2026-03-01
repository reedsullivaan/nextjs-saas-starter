import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { sendInviteEmail } from "@/lib/email";
import { inviteSchema } from "@/lib/validation";
import { requireAuth, apiHandler } from "@/lib/api-utils";

export const POST = apiHandler(async (req, { params }) => {
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

  const workspace = await db.workspace.findUnique({
    where: { id: params.workspaceId },
  });

  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 }
    );
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await db.invite.create({
    data: {
      email,
      role,
      token,
      expiresAt,
      workspaceId: params.workspaceId,
    },
  });

  const inviterName = session.user.name || session.user.email || "A teammate";
  await sendInviteEmail(email, inviterName, workspace.name, token);

  return NextResponse.json(invite, { status: 201 });
});
