import { deleteProject, updateProject } from "@/app/actions";
import { Badge, Button, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { formatCurrency, numberFormatter } from "@/lib/formatters";
import { getDashboard } from "@/lib/data";
import { labelFor, labels } from "@/lib/labels";

export default async function ProjectDashboardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { project, rooms, budget, tasks, decisions, products, vendors, inspirations, differences } = await getDashboard(projectId);
  const planned = budget.reduce((sum, item) => sum + Number(item.planned_cost ?? 0), 0);
  const actual = budget.reduce((sum, item) => sum + Number(item.actual_cost ?? 0), 0);
  const openTasks = tasks.filter((task) => task.status !== "DONE").length;
  const openDecisions = decisions.filter((decision) => decision.status !== "DECIDED").length;

  return (
    <>
      <PageHeader title={project.name} description="Pulpit projektu z najważniejszymi liczbami i statusem prac." />
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm text-muted-foreground">Budżet docelowy</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(project.target_budget)}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Koszt planowany</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(planned)}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Koszt rzeczywisty</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(actual)}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Pozostało</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(Number(project.target_budget ?? 0) - actual)}</p></Card>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-muted-foreground">Otwarte zadania</p><p className="mt-2 text-2xl font-semibold">{openTasks}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Otwarte decyzje</p><p className="mt-2 text-2xl font-semibold">{openDecisions}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Różnice w planach</p><p className="mt-2 text-2xl font-semibold">{differences.filter((item) => item.status === "NEEDS_DISCUSSION").length}</p></Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="font-semibold">Status pomieszczeń</h2>
          <div className="mt-4 grid gap-2">
            {rooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <span>{room.name}</span>
                <Badge>{labelFor(labels.roomStatus, room.status)}</Badge>
              </div>
            ))}
            {!rooms.length ? <p className="text-sm text-muted-foreground">Brak pomieszczeń.</p> : null}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Dane projektu</h2>
          <form action={updateProject.bind(null, projectId)} className="mt-4 grid gap-3">
            <Field label="Nazwa"><input className={inputClass} name="name" defaultValue={project.name} required /></Field>
            <Field label="Metraż"><input className={inputClass} name="area" type="number" step="0.01" defaultValue={project.area ?? ""} /></Field>
            <Field label="Budżet"><input className={inputClass} name="target_budget" type="number" defaultValue={project.target_budget ?? ""} /></Field>
            <Field label="Styl"><input className={inputClass} name="style" defaultValue={project.style ?? ""} /></Field>
            <Field label="Etap"><select className={inputClass} name="stage" defaultValue={project.stage}><option value="PLANNING">Planowanie</option><option value="CONCEPT">Koncepcja</option><option value="QUOTES">Wyceny</option><option value="IN_PROGRESS">W trakcie</option><option value="FINISHING">Wykończenie</option><option value="DONE">Gotowe</option></select></Field>
            <Field label="Opis"><textarea className={inputClass} name="description" rows={3} defaultValue={project.description ?? ""} /></Field>
            <Button>Zapisz</Button>
          </form>
          <form action={deleteProject.bind(null, projectId)} className="mt-3">
            <Button variant="danger">Usuń projekt</Button>
          </form>
        </Card>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm text-muted-foreground">Produkty</p><p className="mt-2 text-xl font-semibold">{products.length}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Wykonawcy</p><p className="mt-2 text-xl font-semibold">{vendors.length}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Inspiracje</p><p className="mt-2 text-xl font-semibold">{inspirations.length}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Metraż</p><p className="mt-2 text-xl font-semibold">{project.area ? `${numberFormatter.format(project.area)} m²` : "Brak"}</p></Card>
      </div>
    </>
  );
}
