import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">Not found</h2>
        <p className="text-muted-foreground">
          The workspace or page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
