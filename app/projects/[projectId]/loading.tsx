function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-muted motion-reduce:animate-none ${className}`} />;
}

export default function ProjectLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Ładowanie projektu">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      <span className="sr-only">Ładowanie projektu…</span>
    </div>
  );
}
