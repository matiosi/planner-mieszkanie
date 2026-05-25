import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/delete-button";
import { requireProject } from "@/lib/data";
import { upsertMeasurement, deleteMeasurement } from "@/app/actions/measurements";
import { Plus, Ruler } from "lucide-react";

export default async function MeasurementsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: measurements }, { data: rooms }] = await Promise.all([
    supabase
      .from("measurements")
      .select("id,name,value,unit,room_id,note")
      .eq("project_id", projectId)
      .order("room_id")
      .order("name"),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
  ]);

  const list = measurements ?? [];
  const roomList = rooms ?? [];

  // Group by room
  const byRoom = list.reduce<Record<string, typeof list>>((acc, m) => {
    const key = m.room_id ?? "__none__";
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  async function addMeasurement(formData: FormData) {
    "use server";
    await upsertMeasurement(projectId, formData);
  }

  const UNITS = ["cm", "m", "mm", "m²", "m³", "szt."];

  return (
    <>
      <PageHeader
        title="Wymiary"
        description={`${list.length} pomiarów`}
      />

      {/* Add form */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj pomiar</h2>
        <form action={addMeasurement} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Nazwa *" className="sm:col-span-2">
            <Input name="name" required placeholder="np. Szerokość ściany zachodniej" />
          </Field>
          <Field label="Wartość *">
            <Input name="value" type="number" step="0.01" required placeholder="0.00" />
          </Field>
          <Field label="Jednostka">
            <Select name="unit" defaultValue="cm">
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </Select>
          </Field>
          <Field label="Pomieszczenie">
            <Select name="room_id" defaultValue="">
              <option value="">— cały projekt —</option>
              {roomList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="Notatka" className="sm:col-span-2">
            <Input name="note" placeholder="Dodatkowe informacje…" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Dodaj pomiar
            </Button>
          </div>
        </form>
      </Card>

      {/* Measurements list */}
      {!list.length ? (
        <EmptyState title="Brak pomiarów" description="Dodaj pierwszy pomiar powyżej." className="mt-6" />
      ) : (
        <div className="mt-6 space-y-6">
          {/* Per room */}
          {roomList.map((room) => {
            const roomMeasurements = byRoom[room.id] ?? [];
            if (!roomMeasurements.length) return null;
            return (
              <Card key={room.id}>
                <h2 className="font-semibold mb-3">{room.name}</h2>
                <div className="space-y-2">
                  {roomMeasurements.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 rounded-md bg-muted px-3 py-2">
                      <Ruler className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{m.name}</span>
                        {m.note && (
                          <span className="text-xs text-muted-foreground ml-2">— {m.note}</span>
                        )}
                      </div>
                      <span className="font-mono font-semibold text-sm shrink-0">
                        {m.value} {m.unit}
                      </span>
                      <DeleteButton
                        action={deleteMeasurement.bind(null, projectId)}
                        id={m.id}
                        confirmMessage={`Usuń pomiar "${m.name}"?`}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}

          {/* Without room */}
          {byRoom["__none__"]?.length > 0 && (
            <Card>
              <h2 className="font-semibold mb-3 text-muted-foreground">Bez przypisanego pomieszczenia</h2>
              <div className="space-y-2">
                {byRoom["__none__"].map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-md bg-muted px-3 py-2">
                    <Ruler className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{m.name}</span>
                      {m.note && (
                        <span className="text-xs text-muted-foreground ml-2">— {m.note}</span>
                      )}
                    </div>
                    <span className="font-mono font-semibold text-sm shrink-0">
                      {m.value} {m.unit}
                    </span>
                    <DeleteButton
                      action={deleteMeasurement.bind(null, projectId)}
                      id={m.id}
                      confirmMessage={`Usuń pomiar "${m.name}"?`}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
