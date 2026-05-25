import { upsertRoom } from "@/app/actions";
import { Button, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { requireProject } from "@/lib/data";

export default async function RoomDetailPage({ params }: { params: Promise<{ projectId: string; roomId: string }> }) {
  const { projectId, roomId } = await params;
  const { supabase } = await requireProject(projectId);
  const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).eq("project_id", projectId).single();
  const [tasks, decisions, products, inspirations, budget, differences] = await Promise.all([
    supabase.from("tasks").select("*").eq("project_id", projectId).eq("room_id", roomId),
    supabase.from("decisions").select("*").eq("project_id", projectId).eq("room_id", roomId),
    supabase.from("products").select("*").eq("project_id", projectId).eq("room_id", roomId),
    supabase.from("inspirations").select("*").eq("project_id", projectId).eq("room_id", roomId),
    supabase.from("budget_items").select("*").eq("project_id", projectId).eq("room_id", roomId),
    supabase.from("plan_differences").select("*").eq("project_id", projectId).eq("room_id", roomId)
  ]);
  const planned = (budget.data ?? []).reduce((sum, item) => sum + Number(item.planned_cost ?? 0), 0);

  return (
    <>
      <PageHeader title={room?.name ?? "Pomieszczenie"} description="Szczegóły pokoju i powiązane elementy projektu." />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4 md:grid-cols-3">
          <Card><p className="text-sm text-muted-foreground">Budżet pokoju</p><p className="mt-2 text-xl font-semibold">{formatCurrency(planned)}</p></Card>
          <Card><p className="text-sm text-muted-foreground">Zadania</p><p className="mt-2 text-xl font-semibold">{tasks.data?.length ?? 0}</p></Card>
          <Card><p className="text-sm text-muted-foreground">Decyzje</p><p className="mt-2 text-xl font-semibold">{decisions.data?.length ?? 0}</p></Card>
          <Card><p className="text-sm text-muted-foreground">Produkty</p><p className="mt-2 text-xl font-semibold">{products.data?.length ?? 0}</p></Card>
          <Card><p className="text-sm text-muted-foreground">Inspiracje</p><p className="mt-2 text-xl font-semibold">{inspirations.data?.length ?? 0}</p></Card>
          <Card><p className="text-sm text-muted-foreground">Różnice w planach</p><p className="mt-2 text-xl font-semibold">{differences.data?.length ?? 0}</p></Card>
        </div>
        <Card>
          <h2 className="font-semibold">Edycja pokoju</h2>
          <form action={upsertRoom.bind(null, projectId)} className="mt-4 grid gap-3">
            <input type="hidden" name="id" value={room?.id} />
            <Field label="Nazwa"><input className={inputClass} name="name" defaultValue={room?.name} required /></Field>
            <Field label="Metraż"><input className={inputClass} name="area" type="number" step="0.01" defaultValue={room?.area ?? ""} /></Field>
            <Field label="Status"><select className={inputClass} name="status" defaultValue={room?.status}><option value="NOT_STARTED">Nierozpoczęte</option><option value="CONCEPT">Koncepcja</option><option value="PRICING">Wycena</option><option value="ORDERING">Zamówienia</option><option value="IN_PROGRESS">W trakcie</option><option value="DONE">Gotowe</option></select></Field>
            <Field label="Budżet"><input className={inputClass} name="budget_planned" type="number" defaultValue={room?.budget_planned ?? ""} /></Field>
            <Field label="Opis koncepcji"><textarea className={inputClass} name="concept_description" rows={3} defaultValue={room?.concept_description ?? ""} /></Field>
            <Field label="Notatki"><textarea className={inputClass} name="notes" rows={3} defaultValue={room?.notes ?? ""} /></Field>
            <Button>Zapisz</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
