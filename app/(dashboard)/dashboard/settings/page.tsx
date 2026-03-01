"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function AccountSettingsPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setMessage("Settings saved");
      } else {
        setMessage("Failed to save");
      }
    } catch {
      setMessage("Something went wrong");
    }

    setSaving(false);
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold mt-4">Account Settings</h1>
      </div>

      {/* Profile */}
      <form onSubmit={handleSave} className="rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            value={session?.user?.email || ""}
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 opacity-50"
            disabled
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </div>
      </form>

      {/* Sessions */}
      <div className="rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold">Sessions</h2>
        <p className="text-sm text-muted-foreground">
          Manage your active sessions and sign out of other devices.
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition"
        >
          Sign out
        </button>
      </div>

      {/* Danger */}
      <div className="rounded-xl border border-destructive/50 p-6 space-y-4">
        <h2 className="font-semibold text-destructive">Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Delete account</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data
            </p>
          </div>
          <button className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition">
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
