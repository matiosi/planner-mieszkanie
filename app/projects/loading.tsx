function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-muted motion-reduce:animate-none ${className}`} />;
}

export default function ProjectsLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Ładowanie projektów">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-8 w-28 shrink-0" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Ładowanie projektów…</span>
    </div>
  );
}
