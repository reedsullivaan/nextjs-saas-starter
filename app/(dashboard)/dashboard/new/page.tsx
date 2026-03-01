"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SlugInput } from "@/components/slug-input";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create workspace");
        setLoading(false);
        return;
      }

      router.push(`/dashboard/${slug}`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          ← Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold mt-4">New Workspace</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <SlugInput
          name={name}
          slug={slug}
          onNameChange={setName}
          onSlugChange={setSlug}
          nameLabel="Workspace name"
          namePlaceholder="My Company"
        />

        <button
          type="submit"
          disabled={loading || !name || !slug}
          className="rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create workspace"}
        </button>
      </form>
    </div>
  );
}
