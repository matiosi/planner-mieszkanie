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
import { upsertConstraint, deleteConstraint } from "@/app/actions/constraints";

const CONSTRAINT_TYPES = [
  { value: "MUST_HAVE", label: "Wymagane", variant: "green" as const },
  { value: "AVOID", label: "Unikać", variant: "red" as const },
  { value: "DISLIKE", label: "Nie lubię", variant: "gray" as const },
  { value: "TECHNICAL_CONSTRAINT", label: "Techniczne", variant: "blue" as const },
  { value: "BUDGET_CONSTRAINT", label: "Budżetowe", variant: "amber" as const },
];

function typeLabel(type: string) {
  return CONSTRAINT_TYPES.find((t) => t.value === type) ?? { label: type, variant: "gray" as const };
}

export default async function ConstraintsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: constraints }, { data: rooms }] = await Promise.all([
    supabase
      .from("project_constraints")
      .select("id,type,description,room_id,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
  ]);

  const list = constraints ?? [];
  const roomList = rooms ?? [];

  return (
    <>
      <PageHeader
        title="Ograniczenia projektu"
        description="Wymagania, preferencje i ograniczenia — podstawa briefu dla projektanta."
      />

      {/* Formularz dodawania */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj ograniczenie</h2>
        <form action={upsertConstraint.bind(null, projectId)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Typ">
            <Select name="type" defaultValue="MUST_HAVE">
              {CONSTRAINT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Pomieszczenie">
            <Select name="room_id" defaultValue="">
              <option value="">— całe mieszkanie —</option>
              {roomList.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Opis *" className="sm:col-span-2">
            <Input name="description" required placeholder="np. Podłoga musi być drewniana, nie laminat" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" size="sm">Dodaj</Button>
          </div>
        </form>
      </Card>

      {/* Lista */}
      {!list.length ? (
        <EmptyState
          title="Brak ograniczeń"
          description="Dodaj wymagania i preferencje — pomogą projektantowi i wykonawcom."
          className="mt-6"
        />
      ) : (
        <div className="mt-6 space-y-6">
          {CONSTRAINT_TYPES.map(({ value, label, variant }) => {
            const group = list.filter((c) => c.type === value);
            if (!group.length) return null;
            return (
              <div key={value}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={variant}>{label}</Badge>
                  <span className="text-xs text-muted-foreground">{group.length}</span>
                </div>
                <div className="grid gap-2">
                  {group.map((c) => {
                    const room = roomList.find((r) => r.id === c.room_id);
                    return (
                      <div
                        key={c.id}
                        className="flex items-start justify-between gap-3 rounded-md border border-border bg-card px-4 py-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{c.description}</p>
                          {room && (
                            <p className="text-xs text-muted-foreground mt-0.5">{room.name}</p>
                          )}
                        </div>
                        <DeleteButton
                          action={deleteConstraint.bind(null, projectId)}
                          id={c.id}
                          confirmMessage={`Usuń ograniczenie?`}
                          size="sm"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
