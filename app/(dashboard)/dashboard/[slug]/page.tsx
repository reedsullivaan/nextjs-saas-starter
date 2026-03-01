import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function WorkspacePage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const workspace = await db.workspace.findUnique({
    where: { slug: params.slug },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      invites: {
        where: { expiresAt: { gt: new Date() } },
      },
    },
  });

  if (!workspace) notFound();

  // Check if user is a member
  const membership = workspace.members.find(
    (m) => m.user.id === session.user.id
  );
  if (!membership) notFound();

  const isAdmin = membership.role === "OWNER" || membership.role === "ADMIN";

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          ← All workspaces
        </Link>
        <div className="flex items-center justify-between mt-4">
          <div>
            <h1 className="text-3xl font-bold">{workspace.name}</h1>
            <p className="text-muted-foreground mt-1">
              {workspace.plan} plan · {workspace.members.length} member
              {workspace.members.length !== 1 ? "s" : ""}
            </p>
          </div>
          {isAdmin && (
            <Link
              href={`/dashboard/${params.slug}/settings`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition"
            >
              Settings
            </Link>
          )}
        </div>
      </div>

      {/* Workspace content area */}
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          This is your workspace. Add your app-specific content here.
        </p>
      </div>

      {/* Team Members */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Team</h2>
          {isAdmin && (
            <Link
              href={`/dashboard/${params.slug}/settings/members`}
              className="text-sm text-primary hover:underline"
            >
              Manage members
            </Link>
          )}
        </div>
        <div className="space-y-2">
          {workspace.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  {(member.user.name || member.user.email || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {member.user.name || member.user.email}
                  </p>
                  {member.user.name && (
                    <p className="text-xs text-muted-foreground">
                      {member.user.email}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                {member.role}
              </span>
            </div>
          ))}
          {workspace.invites.length > 0 && (
            <>
              {workspace.invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded-lg border border-dashed p-4 opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                      ✉
                    </div>
                    <div>
                      <p className="font-medium text-sm">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Invite pending
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                    {invite.role}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
