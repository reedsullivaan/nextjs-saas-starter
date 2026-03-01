"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { inviteSchema } from "@/lib/validation";

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface Invite {
  id: string;
  email: string;
  role: string;
}

interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  members: Member[];
  invites: Invite[];
  role: string;
}

export default function MembersPage() {
  const params = useParams();
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function loadWorkspace() {
    const res = await fetch(`/api/workspaces/by-slug/${params.slug}`);
    if (res.ok) {
      const ws = await res.json();
      setWorkspace(ws);
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, [params.slug]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace) return;

    const parsed = inviteSchema.safeParse({ email: inviteEmail, role: inviteRole });
    if (!parsed.success) {
      setMessage(`Error: ${parsed.error.errors[0].message}`);
      return;
    }

    setInviting(true);
    setMessage("");

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`Error: ${data.error}`);
      } else {
        setMessage(`Invite sent to ${inviteEmail}`);
        setInviteEmail("");
        loadWorkspace();
      }
    } catch {
      setMessage("Failed to send invite");
    }

    setInviting(false);
  }

  async function handleRemove(memberId: string) {
    if (!workspace) return;
    setRemoving(memberId);

    try {
      const res = await fetch(
        `/api/workspaces/${workspace.id}/members/${memberId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setMessage("Member removed");
        loadWorkspace();
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.error}`);
      }
    } catch {
      setMessage("Failed to remove member");
    }

    setRemoving(null);
  }

  if (!workspace) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isAdmin = workspace.role === "OWNER" || workspace.role === "ADMIN";

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href={`/dashboard/${params.slug}/settings`}
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          ← Settings
        </Link>
        <h1 className="text-2xl font-bold mt-4">Members</h1>
        <p className="text-muted-foreground mt-1">
          Manage who has access to {workspace.name}
        </p>
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

      {/* Invite Form */}
      {isAdmin && (
        <form
          onSubmit={handleInvite}
          className="rounded-xl border p-6 space-y-4"
        >
          <h2 className="font-semibold">Invite a team member</h2>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "MEMBER" | "ADMIN")}
              className="rounded-lg border border-input bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 whitespace-nowrap"
            >
              {inviting ? "Sending..." : "Send invite"}
            </button>
          </div>
        </form>
      )}

      {/* Current Members */}
      <div className="space-y-3">
        <h2 className="font-semibold">
          Current members ({workspace.members.length})
        </h2>
        {workspace.members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-medium">
                {(member.user.name || member.user.email)[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium">
                  {member.user.name || member.user.email}
                </p>
                {member.user.name && (
                  <p className="text-sm text-muted-foreground">
                    {member.user.email}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                {member.role}
              </span>
              {isAdmin && member.role !== "OWNER" && (
                <button
                  onClick={() => handleRemove(member.id)}
                  disabled={removing === member.id}
                  className="text-xs text-muted-foreground hover:text-destructive transition disabled:opacity-50"
                >
                  {removing === member.id ? "Removing..." : "Remove"}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Pending Invites */}
        {workspace.invites && workspace.invites.length > 0 && (
          <>
            <h3 className="font-medium text-sm text-muted-foreground pt-2">
              Pending invites
            </h3>
            {workspace.invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg border border-dashed p-4 opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm">
                    ✉
                  </div>
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-muted-foreground">
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
  );
}
