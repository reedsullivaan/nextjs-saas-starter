"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  plan: string;
  stripeCurrentPeriodEnd: string | null;
  members: { role: string; userId: string }[];
}

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetch("/api/workspaces")
      .then((r) => r.json())
      .then((workspaces) => {
        const ws = workspaces.find(
          (w: { slug: string }) => w.slug === params.slug
        );
        if (ws) {
          setWorkspace(ws);
          setName(ws.name);
          setIsOwner(ws.role === "OWNER");
        }
      });
  }, [params.slug]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace) return;
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setMessage("Settings saved");
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.error}`);
      }
    } catch {
      setMessage("Failed to save");
    }

    setSaving(false);
  }

  async function handleDelete() {
    if (!workspace || !confirmDelete) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.error}`);
        setDeleting(false);
      }
    } catch {
      setMessage("Failed to delete");
      setDeleting(false);
    }
  }

  async function handleUpgrade() {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setMessage("Failed to start checkout");
    }
  }

  async function handleManageBilling() {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage(data.error || "No billing account found");
      }
    } catch {
      setMessage("Failed to open billing portal");
    }
  }

  if (!workspace) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
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

      {message && (
        <p
          className={`text-sm ${
            message.startsWith("Error") ? "text-destructive" : "text-green-500"
          }`}
        >
          {message}
        </p>
      )}

      {/* General */}
      <form onSubmit={handleSave} className="rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold">General</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium">Workspace name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">URL slug</label>
          <input
            type="text"
            value={workspace.slug}
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 opacity-50"
            disabled
          />
          <p className="text-xs text-muted-foreground">
            Slug cannot be changed after creation
          </p>
        </div>
        <button
          type="submit"
          disabled={saving || name === workspace.name}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      {/* Billing */}
      <div className="rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold">Billing</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{workspace.plan} Plan</p>
            <p className="text-sm text-muted-foreground">
              {workspace.plan === "FREE"
                ? "Upgrade to unlock more features"
                : `Renews ${workspace.stripeCurrentPeriodEnd ? new Date(workspace.stripeCurrentPeriodEnd).toLocaleDateString() : "N/A"}`}
            </p>
          </div>
          {workspace.plan === "FREE" ? (
            <button
              onClick={handleUpgrade}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              Upgrade to Pro
            </button>
          ) : (
            <button
              onClick={handleManageBilling}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition"
            >
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
      {isOwner && (
        <div className="rounded-xl border border-destructive/50 p-6 space-y-4">
          <h2 className="font-semibold text-destructive">Danger Zone</h2>
          {!confirmDelete ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete workspace</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this workspace and all its data
                </p>
              </div>
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition"
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-destructive font-medium">
                Are you sure? This action cannot be undone. All workspace data,
                members, and invites will be permanently deleted.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Yes, delete permanently"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
