import Link from "next/link";
import { getDashboard } from "@/lib/data";
import { formatCurrency, formatDate, formatPercent } from "@/lib/formatters";
import { labelFor, labels, statusVariant } from "@/lib/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateProject, deleteProject, duplicateProject } from "@/app/actions/projects";
import { Copy } from "lucide-react";
import { DeleteButton } from "@/components/delete-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { inputClass } from "@/components/ui/input";
import { AlertTriangle, TrendingUp, CheckCircle2, Circle, Clock } from "lucide-react";

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { project, rooms, budget, tasks, decisions, products, vendors, inspirations, differences } =
    await getDashboard(projectId);

  const planned = budget.reduce((s, b) => s + Number(b.planned_cost ?? 0), 0);
  const actual = budget.reduce((s, b) => s + Number(b.actual_cost ?? 0), 0);
  const remaining = Number(project.target_budget ?? 0) - actual;
  const openTasks = tasks.filter((t) => t.status !== "DONE").length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== "DONE" && t.due_date && new Date(t.due_date) < new Date()
  ).length;
  const openDecisions = decisions.filter((d) => d.status !== "DECIDED").length;
  const needsDiscussion = differences.filter((d) => d.status === "NEEDS_DISCUSSION").length;
  const budgetUsed = planned > 0 ? Math.round((actual / planned) * 100) : 0;

  return (
    <>
      <PageHeader
        title={project.name}
        description="Pulpit projektu — najważniejsze liczby i status prac."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(project.stage)}>
              {labelFor(labels.projectStage, project.stage)}
            </Badge>
            <form action={duplicateProject.bind(null, projectId)}>
              <Button type="submit" variant="secondary" size="sm">
                <Copy className="h-4 w-4" /> Duplikuj
              </Button>
            </form>
          </div>
        }
      />

      {/* KPI */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-muted-foreground">Budżet docelowy</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(project.target_budget)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Koszt planowany</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(planned)}</p>
          {planned > Number(project.target_budget ?? 0) && (
            <p className="mt-1 text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Przekracza budżet
            </p>
          )}
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Koszt rzeczywisty</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(actual)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatPercent(actual, planned)} planu</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Pozostało</p>
          <p className={`mt-2 text-2xl font-semibold ${remaining < 0 ? "text-destructive" : ""}`}>
            {formatCurrency(remaining)}
          </p>
        </Card>
      </div>

      {/* Statusy */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-muted-foreground">Otwarte zadania</p>
          <p className="mt-2 text-2xl font-semibold">{openTasks}</p>
          {overdueTasks > 0 && (
            <p className="mt-1 text-xs text-destructive">{overdueTasks} zaległych</p>
          )}
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Otwarte decyzje</p>
          <p className="mt-2 text-2xl font-semibold">{openDecisions}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Różnice planów</p>
          <p className="mt-2 text-2xl font-semibold">{needsDiscussion}</p>
          {needsDiscussion > 0 && <p className="mt-1 text-xs text-amber-600">do omówienia</p>}
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Inspiracje</p>
          <p className="mt-2 text-2xl font-semibold">{inspirations.length}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Pomieszczenia */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Status pomieszczeń</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/projects/${projectId}/rooms`}>Zobacz wszystkie</Link>
            </Button>
          </div>
          <div className="grid gap-2">
            {rooms.map((room) => (
              <Link
                key={room.id}
                href={`/projects/${projectId}/rooms/${room.id}`}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium">{room.name}</span>
                <Badge variant={statusVariant(room.status)}>
                  {labelFor(labels.roomStatus, room.status)}
                </Badge>
              </Link>
            ))}
            {!rooms.length && (
              <p className="text-sm text-muted-foreground py-4 text-center">Brak pomieszczeń.</p>
            )}
          </div>
        </Card>

        {/* Dane projektu */}
        <Card>
          <h2 className="font-semibold mb-4">Edytuj dane projektu</h2>
          <form action={updateProject.bind(null, projectId)} className="grid gap-3">
            <Field label="Nazwa">
              <Input name="name" defaultValue={project.name} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Metraż (m²)">
                <Input name="area" type="number" step="0.01" defaultValue={project.area ?? ""} />
              </Field>
              <Field label="Budżet (PLN)">
                <Input name="target_budget" type="number" defaultValue={project.target_budget ?? ""} />
              </Field>
            </div>
            <Field label="Styl">
              <Input name="style" defaultValue={project.style ?? ""} />
            </Field>
            <Field label="Etap">
              <Select name="stage" defaultValue={project.stage}>
                <option value="PLANNING">Planowanie</option>
                <option value="CONCEPT">Koncepcja</option>
                <option value="QUOTES">Wyceny</option>
                <option value="IN_PROGRESS">W trakcie</option>
                <option value="FINISHING">Wykończenie</option>
                <option value="DONE">Gotowe</option>
              </Select>
            </Field>
            <Field label="Rezerwa (%)">
              <Input name="contingency_percent" type="number" min="0" max="50" defaultValue={project.contingency_percent ?? 10} />
            </Field>
            <Field label="Opis">
              <Textarea name="description" rows={2} defaultValue={project.description ?? ""} />
            </Field>
            <Button type="submit" size="sm">Zapisz</Button>
          </form>
          <div className="mt-4 pt-4 border-t border-border">
            <DeleteButton
              action={deleteProject.bind(null, projectId)}
              id={projectId}
              confirmMessage={`Czy na pewno chcesz usunąć projekt "${project.name}" i wszystkie dane? Tej operacji nie można cofnąć.`}
              label="Usuń projekt"
            />
          </div>
        </Card>
      </div>

      {/* Ostatnie zadania */}
      <Card className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Zadania</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/projects/${projectId}/tasks`}>Zobacz wszystkie</Link>
          </Button>
        </div>
        <div className="grid gap-2">
          {tasks.slice(0, 5).map((task) => {
            const isOverdue = task.status !== "DONE" && task.due_date && new Date(task.due_date) < new Date();
            return (
              <div key={task.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                {task.status === "DONE" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : task.status === "BLOCKED" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className={`text-sm flex-1 truncate ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                  {task.title}
                </span>
                {task.due_date && (
                  <span className={`text-xs shrink-0 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                    {isOverdue && <Clock className="inline h-3 w-3 mr-0.5" />}
                    {formatDate(task.due_date)}
                  </span>
                )}
              </div>
            );
          })}
          {!tasks.length && (
            <p className="text-sm text-muted-foreground py-4 text-center">Brak zadań.</p>
          )}
        </div>
      </Card>
    </>
  );
}
