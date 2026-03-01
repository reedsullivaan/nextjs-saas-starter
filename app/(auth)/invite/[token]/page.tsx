"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invite, setInvite] = useState<{
    email: string;
    workspaceName: string;
  } | null>(null);

  useEffect(() => {
    // Fetch invite details
    fetch(`/api/invites/${params.token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setInvite(data);
      })
      .catch(() => setError("Failed to load invite"));
  }, [params.token]);

  async function handleAccept() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/invites/${params.token}/accept`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to accept invite");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-4 p-6 text-center">
          <h1 className="text-2xl font-bold">You've been invited!</h1>
          <p className="text-muted-foreground">
            Sign in or create an account to accept this invite.
          </p>
          <Link
            href={`/login?callbackUrl=/invite/${params.token}`}
            className="block rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            Sign in to continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 p-6 text-center">
        {error ? (
          <>
            <h1 className="text-2xl font-bold">Invalid invite</h1>
            <p className="text-muted-foreground">{error}</p>
            <Link
              href="/dashboard"
              className="block text-primary hover:underline"
            >
              Go to dashboard
            </Link>
          </>
        ) : invite ? (
          <>
            <h1 className="text-2xl font-bold">Join {invite.workspaceName}</h1>
            <p className="text-muted-foreground">
              You've been invited to join as a team member.
            </p>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loading ? "Joining..." : "Accept invite"}
            </button>
          </>
        ) : (
          <p className="text-muted-foreground">Loading invite...</p>
        )}
      </div>
    </div>
  );
}
