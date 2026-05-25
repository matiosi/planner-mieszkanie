import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DeleteButton } from "@/components/delete-button";
import { labelFor, labels, statusVariant } from "@/lib/labels";
import { formatDate } from "@/lib/formatters";
import { requireProject } from "@/lib/data";
import { upsertTask, deleteTask } from "@/app/actions/tasks";
import { Plus, Clock, AlertTriangle } from "lucide-react";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: tasks }, { data: rooms }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id,title,description,status,priority,due_date,room_id")
      .eq("project_id", projectId)
      .order("priority", { ascending: false })
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
  ]);

  const list = tasks ?? [];
  const roomList = rooms ?? [];
  const today = new Date();

  const grouped: Record<string, typeof list> = {
    TODO: list.filter((t) => t.status === "TODO"),
    IN_PROGRESS: list.filter((t) => t.status === "IN_PROGRESS"),
    BLOCKED: list.filter((t) => t.status === "BLOCKED"),
    DONE: list.filter((t) => t.status === "DONE"),
  };

  async function addTask(formData: FormData) {
    "use server";
    await upsertTask(projectId, formData);
  }

  return (
    <>
      <PageHeader
        title="Zadania"
        description={`${list.filter((t) => t.status !== "DONE").length} otwartych z ${list.length}`}
      />

      {/* Formularz dodawania */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj zadanie</h2>
        <form action={addTask} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Tytuł *" className="sm:col-span-2">
            <Input name="title" required placeholder="Co trzeba zrobić?" />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="TODO">
              {Object.entries(labels.taskStatus).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Priorytet">
            <Select name="priority" defaultValue="MEDIUM">
              {Object.entries(labels.priority).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Termin">
            <Input name="due_date" type="date" />
          </Field>
          <Field label="Pomieszczenie">
            <Select name="room_id" defaultValue="">
              <option value="">— brak —</option>
              {roomList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="Opis" className="sm:col-span-2">
            <Input name="description" placeholder="Opcjonalny opis…" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Dodaj zadanie
            </Button>
          </div>
        </form>
      </Card>

      {/* Kanban */}
      {!list.length ? (
        <EmptyState title="Brak zadań" description="Dodaj pierwsze zadanie powyżej." className="mt-6" />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as const).map((status) => (
            <div key={status}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">{labelFor(labels.taskStatus, status)}</span>
                <Badge variant={statusVariant(status)}>{grouped[status].length}</Badge>
              </div>
              <div className="space-y-2">
                {grouped[status].map((task) => {
                  const isOverdue = task.status !== "DONE" && task.due_date && new Date(task.due_date) < today;
                  const roomName = roomList.find((r) => r.id === task.room_id)?.name;
                  return (
                    <Card key={task.id} className="p-3 gap-2 flex flex-col">
                      <p className="text-sm font-medium leading-snug">{task.title}</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={statusVariant(task.priority)}>{labelFor(labels.priority, task.priority)}</Badge>
                        {roomName && <Badge variant="gray">{roomName}</Badge>}
                      </div>
                      {task.due_date && (
                        <p className={`text-xs flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                          {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {formatDate(task.due_date)}
                        </p>
                      )}
                      <div className="flex gap-2 mt-1">
                        <form action={async (fd: FormData) => {
                          "use server";
                          fd.set("id", task.id);
                          fd.set("title", task.title);
                          fd.set("status", status === "TODO" ? "DONE" : "TODO");
                          fd.set("priority", task.priority);
                          await upsertTask(projectId, fd);
                        }}>
                          <Button type="submit" variant="ghost" size="sm" className="text-xs">
                            {status === "DONE" ? "Cofnij" : "Ukończ"}
                          </Button>
                        </form>
                        <DeleteButton
                          action={deleteTask.bind(null, projectId)}
                          id={task.id}
                          confirmMessage={`Usuń zadanie "${task.title}"?`}
                          size="sm"
                        />
                      </div>
                    </Card>
                  );
                })}
                {!grouped[status].length && (
                  <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    Brak
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
