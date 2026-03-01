import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-6xl font-bold tracking-tight">
          Ship your SaaS
          <span className="text-blue-600"> faster</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Production-ready starter with auth, billing, teams, and everything you
          need to launch. Stop rebuilding the same boilerplate.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            Get Started
          </Link>
          <Link
            href="https://github.com/reed-sullivan/nextjs-saas-starter"
            className="rounded-lg border border-border px-8 py-3 text-lg font-medium hover:bg-accent transition"
          >
            View Source
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-6 pt-12 text-left">
          <div className="space-y-2">
            <h3 className="font-semibold">🔐 Auth Ready</h3>
            <p className="text-sm text-muted-foreground">
              Email, Google, GitHub. Sessions, JWT, role-based access.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">💳 Stripe Billing</h3>
            <p className="text-sm text-muted-foreground">
              Subscriptions, trials, usage metering, customer portal.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">👥 Teams Built In</h3>
            <p className="text-sm text-muted-foreground">
              Multi-tenant workspaces, invites, owner/admin/member roles.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
