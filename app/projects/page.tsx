import Link from "next/link";
import { createDemoProject } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Button, Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { formatCurrency, numberFormatter } from "@/lib/formatters";
import { labelFor, labels } from "@/lib/labels";
import { requireUser } from "@/lib/data";

export default async function ProjectsPage() {
  const { supabase, user } = await requireUser();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <AppShell>
      <PageHeader
        title="Projekty"
        description="Wybierz mieszkanie albo utwórz nowy projekt wykończenia."
        actions={
          <>
            <form action={createDemoProject}>
              <Button variant="secondary">Utwórz przykładowe mieszkanie</Button>
            </form>
            <LinkButton href="/projects/new">Nowy projekt</LinkButton>
          </>
        }
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects?.length ? (
          projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full hover:border-primary">
                <h2 className="text-lg font-semibold">{project.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{project.style || "Brak opisu stylu"}</p>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <span>Metraż: {project.area ? `${numberFormatter.format(project.area)} m²` : "Brak"}</span>
                  <span>Budżet: {formatCurrency(project.target_budget)}</span>
                  <span className="col-span-2">Etap: {labelFor(labels.projectStage, project.stage)}</span>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState title="Nie masz jeszcze projektów" description="Utwórz pierwszy projekt albo dodaj przykładowe mieszkanie." />
          </div>
        )}
      </div>
    </AppShell>
  );
}
