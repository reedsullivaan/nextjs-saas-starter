"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlugInput } from "@/components/slug-input";

export default function OnboardingPage() {
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

      router.push("/dashboard");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Create your workspace</h1>
          <p className="text-muted-foreground">
            This is where your team will live. You can always change this later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <SlugInput
            name={name}
            slug={slug}
            onNameChange={setName}
            onSlugChange={setSlug}
            nameLabel="Workspace name"
            namePlaceholder="Acme Inc."
          />

          <button
            type="submit"
            disabled={loading || !name || !slug}
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create workspace"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full rounded-lg border border-border px-4 py-2.5 font-medium hover:bg-accent transition text-sm"
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
}
