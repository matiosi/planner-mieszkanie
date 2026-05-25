import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/data";
import { formatCurrency, formatArea } from "@/lib/formatters";
import { labelFor, labels, statusVariant } from "@/lib/labels";
import { createDemoProject } from "@/app/actions/projects";
import { Plus, Wand2 } from "lucide-react";

export default async function ProjectsPage() {
  const { supabase } = await requireUser();
  const { data: projects } = await supabase
    .from("projects")
    .select("id,name,area,target_budget,stage,created_at")
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
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="block">
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold truncate">{p.name}</h2>
                  <Badge variant={statusVariant(p.stage)} className="shrink-0">
                    {labelFor(labels.projectStage, p.stage)}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  {p.area && <span>📐 {formatArea(p.area)}</span>}
                  {p.target_budget && <span>💰 {formatCurrency(p.target_budget)}</span>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
