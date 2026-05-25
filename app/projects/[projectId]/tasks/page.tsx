import { deleteRow, upsertTask } from "@/app/actions";
import { Badge, Button, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { formatDate } from "@/lib/formatters";
import { labelFor, labels } from "@/lib/labels";
import { requireProject } from "@/lib/data";

export default async function TasksPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);
  const [tasks, rooms] = await Promise.all([
    supabase.from("tasks").select("*, rooms(name)").eq("project_id", projectId).order("due_date", { ascending: true }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("name")
  ]);

  return (
    <>
      <PageHeader title="Zadania" description="Lista zadań, priorytetów, terminów i blokad." />
      <Card className="mt-6">
        <form action={upsertTask.bind(null, projectId)} className="grid gap-3 md:grid-cols-7">
          <Field label="Tytuł"><input className={inputClass} name="title" required /></Field>
          <Field label="Pokój"><select className={inputClass} name="room_id"><option value="">Cały projekt</option>{rooms.data?.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></Field>
          <Field label="Status"><select className={inputClass} name="status">{Object.entries(labels.taskStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="Priorytet"><select className={inputClass} name="priority">{Object.entries(labels.priority).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="Termin"><input className={inputClass} name="due_date" type="date" /></Field>
          <Field label="Blokada"><input className={inputClass} name="blocked_by" /></Field>
          <div className="flex items-end"><Button className="w-full">Dodaj</Button></div>
        </form>
      </Card>
      <div className="mt-6 grid gap-3">
        {tasks.data?.map((task) => (
          <Card key={task.id} className="grid gap-3 md:grid-cols-[1fr_130px_120px_130px_90px] md:items-center">
            <div><h2 className="font-medium">{task.title}</h2><p className="text-sm text-muted-foreground">{task.rooms?.name ?? "Cały projekt"} · {task.blocked_by || "Bez blokad"}</p></div>
            <Badge>{labelFor(labels.taskStatus, task.status)}</Badge>
            <Badge>{labelFor(labels.priority, task.priority)}</Badge>
            <span className="text-sm">{formatDate(task.due_date)}</span>
            <form action={deleteRow.bind(null, projectId, "tasks", "/tasks")}><input type="hidden" name="id" value={task.id} /><Button variant="danger">Usuń</Button></form>
          </Card>
        ))}
      </div>
    </>
  );
}
