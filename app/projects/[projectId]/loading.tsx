import { Card } from "@/components/ui";

export default function ProjectLoading() {
  return (
    <div className="grid gap-4">
      <div className="h-16 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="h-28 animate-pulse bg-muted" />
        <Card className="h-28 animate-pulse bg-muted" />
        <Card className="h-28 animate-pulse bg-muted" />
      </div>
    </div>
  );
}
