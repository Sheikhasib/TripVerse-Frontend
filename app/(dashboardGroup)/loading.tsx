export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-9 w-48 rounded-md bg-muted" />
      <div className="rounded-lg bg-card p-6 ring-1 ring-foreground/5">
        <div className="h-10 w-72 rounded-md bg-muted" />
        <div className="mt-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-md bg-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}