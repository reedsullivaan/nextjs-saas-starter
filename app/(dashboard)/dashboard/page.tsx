import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const memberships = await db.member.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: { members: { include: { user: true } } },
      },
    },
  });

  const totalMembers = memberships.reduce(
    (sum, m) => sum + m.workspace.members.length,
    0
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          New Workspace
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border p-6 space-y-2">
          <p className="text-sm text-muted-foreground">Workspaces</p>
          <p className="text-3xl font-bold">{memberships.length}</p>
        </div>
        <div className="rounded-xl border p-6 space-y-2">
          <p className="text-sm text-muted-foreground">Team Members</p>
          <p className="text-3xl font-bold">{totalMembers}</p>
        </div>
        <div className="rounded-xl border p-6 space-y-2">
          <p className="text-sm text-muted-foreground">Plan</p>
          <p className="text-3xl font-bold">
            {memberships[0]?.workspace.plan || "FREE"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Workspaces</h2>
        {memberships.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center space-y-4">
            <p className="text-muted-foreground">
              No workspaces yet. Create one to get started.
            </p>
            <Link
              href="/dashboard/new"
              className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              Create workspace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memberships.map(({ workspace, role }) => (
              <Link
                key={workspace.id}
                href={`/dashboard/${workspace.slug}`}
                className="rounded-xl border p-6 hover:border-primary/50 transition block"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{workspace.name}</h3>
                  <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                    {role}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {workspace.members.length} member
                  {workspace.members.length !== 1 ? "s" : ""} · {workspace.plan}{" "}
                  plan
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t">
        <Link
          href="/dashboard/settings"
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          Account settings →
        </Link>
      </div>
    </div>
  );
}
