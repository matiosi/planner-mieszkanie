import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DeleteButton } from "@/components/delete-button";
import { labelFor, labels, statusVariant } from "@/lib/labels";
import { formatArea, formatCurrency } from "@/lib/formatters";
import { requireProject } from "@/lib/data";
import { upsertRoom, deleteRoom } from "@/app/actions/rooms";
import { ArrowLeft } from "lucide-react";

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; roomId: string }>;
}) {
  const { projectId, roomId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: room }, { data: tasks }, { data: decisions }, { data: products }, { data: budget }] =
    await Promise.all([
      supabase
        .from("rooms")
        .select("id,name,area,status,concept_description,notes,budget_planned")
        .eq("id", roomId)
        .eq("project_id", projectId)
        .single(),
      supabase.from("tasks").select("id,title,status,priority").eq("project_id", projectId).eq("room_id", roomId),
      supabase.from("decisions").select("id,title,status").eq("project_id", projectId).eq("room_id", roomId),
      supabase.from("products").select("id,name,status,price").eq("project_id", projectId).eq("room_id", roomId),
      supabase.from("budget_items").select("id,name,planned_cost,actual_cost").eq("project_id", projectId).eq("room_id", roomId),
    ]);

  if (!room) notFound();

  const plannedCost = budget?.reduce((s, b) => s + Number(b.planned_cost ?? 0), 0) ?? 0;
  const actualCost = budget?.reduce((s, b) => s + Number(b.actual_cost ?? 0), 0) ?? 0;

  async function saveRoom(formData: FormData) {
    "use server";
    formData.set("id", roomId);
    await upsertRoom(projectId, null, formData);
  }

  return (
    <>
      <PageHeader
        title={room.name}
        description="Szczegóły pomieszczenia"
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href={`/projects/${projectId}/rooms`}>
              <ArrowLeft className="h-4 w-4" /> Wróć
            </Link>
          </Button>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Info */}
        <div className="space-y-6">
          {/* Budżet pokoju */}
          <Card>
            <h2 className="font-semibold mb-4">Budżet pokoju</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Planowany</p>
                <p className="text-lg font-semibold">{formatCurrency(room.budget_planned)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Z pozycji budżetu</p>
                <p className="text-lg font-semibold">{formatCurrency(plannedCost)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rzeczywisty</p>
                <p className="text-lg font-semibold">{formatCurrency(actualCost)}</p>
              </div>
            </div>
          </Card>

          {/* Zadania */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Zadania ({tasks?.length ?? 0})</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/projects/${projectId}/tasks`}>Wszystkie</Link>
              </Button>
            </div>
            {tasks?.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm">{t.title}</span>
                <Badge variant={statusVariant(t.status)} >{labelFor(labels.taskStatus, t.status)}</Badge>
              </div>
            ))}
            {!tasks?.length && <p className="text-sm text-muted-foreground">Brak zadań.</p>}
          </Card>

          {/* Decyzje */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Decyzje ({decisions?.length ?? 0})</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/projects/${projectId}/decisions`}>Wszystkie</Link>
              </Button>
            </div>
            {decisions?.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm">{d.title}</span>
                <Badge variant={statusVariant(d.status)}>{labelFor(labels.decisionStatus, d.status)}</Badge>
              </div>
            ))}
            {!decisions?.length && <p className="text-sm text-muted-foreground">Brak decyzji.</p>}
          </Card>

          {/* Produkty */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Produkty ({products?.length ?? 0})</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/projects/${projectId}/products`}>Wszystkie</Link>
              </Button>
            </div>
            {products?.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm">{p.name}</span>
                <div className="flex items-center gap-2">
                  {p.price && <span className="text-xs text-muted-foreground">{formatCurrency(p.price)}</span>}
                  <Badge variant={statusVariant(p.status)}>{labelFor(labels.productStatus, p.status)}</Badge>
                </div>
              </div>
            ))}
            {!products?.length && <p className="text-sm text-muted-foreground">Brak produktów.</p>}
          </Card>
        </div>

        {/* Edycja */}
        <Card>
          <h2 className="font-semibold mb-4">Edytuj pomieszczenie</h2>
          <form action={saveRoom} className="grid gap-3">
            <Field label="Nazwa">
              <Input name="name" defaultValue={room.name} required />
            </Field>
            <Field label="Powierzchnia (m²)">
              <Input name="area" type="number" step="0.01" defaultValue={room.area ?? ""} />
            </Field>
            <Field label="Budżet (PLN)">
              <Input name="budget_planned" type="number" defaultValue={room.budget_planned ?? ""} />
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue={room.status}>
                {Object.entries(labels.roomStatus).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </Field>
            <Field label="Opis koncepcji">
              <Textarea name="concept_description" rows={3} defaultValue={room.concept_description ?? ""} />
            </Field>
            <Field label="Notatki">
              <Textarea name="notes" rows={3} defaultValue={room.notes ?? ""} />
            </Field>
            <Button type="submit" size="sm">Zapisz</Button>
          </form>
          <div className="mt-4 pt-4 border-t border-border">
            <DeleteButton
              action={deleteRoom.bind(null, projectId)}
              id={room.id}
              confirmMessage={`Usuń pomieszczenie "${room.name}"?`}
              label="Usuń pomieszczenie"
            />
          </div>
        </Card>
      </div>
    </>
  );
}
