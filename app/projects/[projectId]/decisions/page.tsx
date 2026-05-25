import { deleteRow, upsertDecision } from "@/app/actions";
import { Badge, Button, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { labelFor, labels } from "@/lib/labels";
import { requireProject } from "@/lib/data";

export default async function DecisionsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);
  const [decisions, rooms] = await Promise.all([
    supabase.from("decisions").select("*, rooms(name)").eq("project_id", projectId).order("created_at"),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("name")
  ]);

  return (
    <>
      <PageHeader title="Decyzje" description="Decyzje projektowe z etapem researchu, krótką listą i wyborem." />
      <Card className="mt-6">
        <form action={upsertDecision.bind(null, projectId)} className="grid gap-3 md:grid-cols-6">
          <Field label="Tytuł"><input className={inputClass} name="title" required /></Field>
          <Field label="Pokój"><select className={inputClass} name="room_id"><option value="">Cały projekt</option>{rooms.data?.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></Field>
          <Field label="Status"><select className={inputClass} name="status">{Object.entries(labels.decisionStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="Wybrana opcja"><input className={inputClass} name="selected_option" /></Field>
          <Field label="Opis"><input className={inputClass} name="description" /></Field>
          <div className="flex items-end"><Button className="w-full">Dodaj</Button></div>
        </form>
      </Card>
      <div className="mt-6 grid gap-3">
        {decisions.data?.map((decision) => (
          <Card key={decision.id} className="grid gap-3 md:grid-cols-[1fr_160px_180px_90px] md:items-center">
            <div><h2 className="font-medium">{decision.title}</h2><p className="text-sm text-muted-foreground">{decision.rooms?.name ?? "Cały projekt"} · {decision.selected_option || "Brak wyboru"}</p></div>
            <Badge>{labelFor(labels.decisionStatus, decision.status)}</Badge>
            <span className="text-sm">{decision.description}</span>
            <form action={deleteRow.bind(null, projectId, "decisions", "/decisions")}><input type="hidden" name="id" value={decision.id} /><Button variant="danger">Usuń</Button></form>
          </Card>
        ))}
      </div>
    </>
  );
}
