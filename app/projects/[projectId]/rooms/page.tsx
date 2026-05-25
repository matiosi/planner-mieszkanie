import Link from "next/link";
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
import { formatArea, formatCurrency } from "@/lib/formatters";
import { requireProject } from "@/lib/data";
import { upsertRoom, deleteRoom } from "@/app/actions/rooms";
import { Plus, ChevronRight } from "lucide-react";

export default async function RoomsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id,name,area,status,budget_planned,sort_order")
    .eq("project_id", projectId)
    .order("sort_order")
    .order("created_at");

  const list = rooms ?? [];

  async function addRoom(formData: FormData) {
    "use server";
    await upsertRoom(projectId, null, formData);
  }

  return (
    <>
      <PageHeader title="Pomieszczenia" description="Zarządzaj pokojami i ich statusem." />

      {/* Formularz dodawania */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj pomieszczenie</h2>
        <form action={addRoom} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Nazwa *">
            <Input name="name" required placeholder="np. Salon" />
          </Field>
          <Field label="Powierzchnia (m²)">
            <Input name="area" type="number" step="0.01" placeholder="np. 25" />
          </Field>
          <Field label="Budżet (PLN)">
            <Input name="budget_planned" type="number" placeholder="np. 30000" />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="NOT_STARTED">
              {Object.entries(labels.roomStatus).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" />
              Dodaj pomieszczenie
            </Button>
          </div>
        </form>
      </Card>

      {/* Lista */}
      {!list.length ? (
        <EmptyState
          title="Brak pomieszczeń"
          description="Dodaj pierwsze pomieszczenie powyżej."
          className="mt-6"
        />
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((room) => (
            <Card key={room.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/projects/${projectId}/rooms/${room.id}`}
                  className="font-medium hover:underline"
                >
                  {room.name}
                </Link>
                <Badge variant={statusVariant(room.status)}>
                  {labelFor(labels.roomStatus, room.status)}
                </Badge>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                {room.area && <span>{formatArea(room.area)}</span>}
                {room.budget_planned && <span>{formatCurrency(room.budget_planned)}</span>}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Button asChild variant="secondary" size="sm" className="flex-1">
                  <Link href={`/projects/${projectId}/rooms/${room.id}`}>
                    Szczegóły <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
                <DeleteButton
                  action={deleteRoom.bind(null, projectId)}
                  id={room.id}
                  confirmMessage={`Czy na pewno chcesz usunąć pomieszczenie "${room.name}"?`}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
