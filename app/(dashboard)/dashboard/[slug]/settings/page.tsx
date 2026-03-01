import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const workspace = await db.workspace.findUnique({
    where: { slug: params.slug },
    include: { members: true },
  });

  if (!workspace) notFound();

  const membership = workspace.members.find(
    (m) => m.userId === session.user.id
  );
  if (!membership || membership.role === "MEMBER") {
    redirect(`/dashboard/${params.slug}`);
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href={`/dashboard/${params.slug}`}
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          ← Back to {workspace.name}
        </Link>
        <h1 className="text-2xl font-bold mt-4">Workspace Settings</h1>
      </div>

      <div className="space-y-6">
        {/* General */}
        <div className="rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold">General</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium">Workspace name</label>
            <input
              type="text"
              defaultValue={workspace.name}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">URL slug</label>
            <input
              type="text"
              defaultValue={workspace.slug}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Slug cannot be changed after creation
            </p>
          </div>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition">
            Save changes
          </button>
        </div>

        {/* Billing */}
        <div className="rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold">Billing</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{workspace.plan} Plan</p>
              <p className="text-sm text-muted-foreground">
                {workspace.plan === "FREE"
                  ? "Upgrade to unlock more features"
                  : `Renews ${workspace.stripeCurrentPeriodEnd?.toLocaleDateString() || "N/A"}`}
              </p>
            </div>
            {workspace.plan === "FREE" ? (
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition">
                Upgrade to Pro
              </button>
            ) : (
              <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition">
                Manage billing
              </button>
            )}
          </div>
        </div>

        {/* Members */}
        <div className="rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Members</h2>
            <Link
              href={`/dashboard/${params.slug}/settings/members`}
              className="text-sm text-primary hover:underline"
            >
              Manage →
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            {workspace.members.length} member
            {workspace.members.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Danger Zone */}
        {membership.role === "OWNER" && (
          <div className="rounded-xl border border-destructive/50 p-6 space-y-4">
            <h2 className="font-semibold text-destructive">Danger Zone</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete workspace</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this workspace and all its data
                </p>
              </div>
              <button className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition">
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
