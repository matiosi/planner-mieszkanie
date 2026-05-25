import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/data";
import { formatCurrency, formatArea, formatDate } from "@/lib/formatters";
import { labelFor, labels, statusVariant } from "@/lib/labels";
import { createDemoProject } from "@/app/actions/projects";
import { Plus, Wand2, Ruler, Wallet, CalendarDays, ChevronRight } from "lucide-react";

export default async function ProjectsPage() {
  const { supabase } = await requireUser();
  const { data: projects } = await supabase
    .from("projects")
    .select("id,name,area,target_budget,stage,style,created_at")
    .order("created_at", { ascending: false });

  return (
    <AppShell>
      <PageHeader
        title="Projekty"
        description="Zarządzaj swoimi projektami wykończenia mieszkania."
        actions={
          <div className="flex gap-2">
            <form action={createDemoProject}>
              <Button type="submit" variant="secondary" size="sm">
                <Wand2 className="h-4 w-4" />
                Przykładowe mieszkanie
              </Button>
            </form>
            <Button asChild size="sm">
              <Link href="/projects/new">
                <Plus className="h-4 w-4" />
                Nowy projekt
              </Link>
            </Button>
          </div>
        }
      />

      {!projects?.length ? (
        <EmptyState
          title="Brak projektów"
          description="Utwórz swój pierwszy projekt lub wczytaj przykładowe mieszkanie."
          className="mt-6"
          action={
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="h-4 w-4" />
                Nowy projekt
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="group block">
              <div className="rounded-lg border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="font-semibold text-base leading-tight line-clamp-2 flex-1">
                    {p.name}
                  </h2>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" />
                </div>

                {/* Stage badge */}
                <Badge variant={statusVariant(p.stage)} className="mb-4">
                  {labelFor(labels.projectStage, p.stage)}
                </Badge>

                {/* Style */}
                {p.style && (
                  <p className="text-xs text-muted-foreground mb-3 italic">{p.style}</p>
                )}

                {/* Stats */}
                <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  {p.area && (
                    <div className="flex items-center gap-2">
                      <Ruler className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatArea(p.area)}</span>
                    </div>
                  )}
                  {p.target_budget && (
                    <div className="flex items-center gap-2">
                      <Wallet className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatCurrency(p.target_budget)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <span>{formatDate(p.created_at)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
