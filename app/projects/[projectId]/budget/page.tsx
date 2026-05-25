import { deleteRow, upsertBudgetItem } from "@/app/actions";
import { Badge, Button, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { labelFor, labels } from "@/lib/labels";
import { requireProject } from "@/lib/data";

export default async function BudgetPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);
  const [items, rooms] = await Promise.all([
    supabase.from("budget_items").select("*, rooms(name)").eq("project_id", projectId).order("created_at"),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("name")
  ]);
  const planned = (items.data ?? []).reduce((sum, item) => sum + Number(item.planned_cost ?? 0), 0);
  const actual = (items.data ?? []).reduce((sum, item) => sum + Number(item.actual_cost ?? 0), 0);

  return (
    <>
      <PageHeader title="Budżet" description="Planowane i rzeczywiste koszty z podziałem na kategorie i pomieszczenia." />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-muted-foreground">Planowane</p><p className="text-2xl font-semibold">{formatCurrency(planned)}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Rzeczywiste</p><p className="text-2xl font-semibold">{formatCurrency(actual)}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Różnica</p><p className="text-2xl font-semibold">{formatCurrency(actual - planned)}</p></Card>
      </div>
      <Card className="mt-6">
        <form action={upsertBudgetItem.bind(null, projectId)} className="grid gap-3 md:grid-cols-7">
          <Field label="Nazwa"><input className={inputClass} name="name" required /></Field>
          <Field label="Kategoria"><select className={inputClass} name="category">{Object.entries(labels.budgetCategory).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="Pokój"><select className={inputClass} name="room_id"><option value="">Cały projekt</option>{rooms.data?.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></Field>
          <Field label="Plan"><input className={inputClass} name="planned_cost" type="number" /></Field>
          <Field label="Rzeczywiste"><input className={inputClass} name="actual_cost" type="number" /></Field>
          <Field label="Status"><select className={inputClass} name="status">{Object.entries(labels.budgetStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <div className="flex items-end"><Button className="w-full">Dodaj</Button></div>
        </form>
      </Card>
      <div className="mt-6 grid gap-3">
        {items.data?.map((item) => (
          <Card key={item.id} className="grid gap-3 md:grid-cols-[1fr_140px_140px_160px_90px] md:items-center">
            <div><h2 className="font-medium">{item.name}</h2><p className="text-sm text-muted-foreground">{labelFor(labels.budgetCategory, item.category)} · {item.rooms?.name ?? "Cały projekt"}</p></div>
            <span>{formatCurrency(item.planned_cost)}</span>
            <span>{formatCurrency(item.actual_cost)}</span>
            <Badge>{labelFor(labels.budgetStatus, item.status)}</Badge>
            <form action={deleteRow.bind(null, projectId, "budget_items", "/budget")}><input type="hidden" name="id" value={item.id} /><Button variant="danger">Usuń</Button></form>
          </Card>
        ))}
      </div>
    </>
  );
}
