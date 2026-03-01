export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-4 bg-muted rounded w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border p-6 space-y-2">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-8 bg-muted rounded w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-6 bg-muted rounded w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border p-6 space-y-2">
              <div className="h-5 bg-muted rounded w-32" />
              <div className="h-4 bg-muted rounded w-48" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
