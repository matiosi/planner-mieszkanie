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
import { requireProject } from "@/lib/data";
import { upsertDecision, deleteDecision } from "@/app/actions/decisions";
import { Plus } from "lucide-react";

export default async function DecisionsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: decisions }, { data: rooms }] = await Promise.all([
    supabase
      .from("decisions")
      .select("id,title,description,status,selected_option,notes,room_id,requires_approval")
      .eq("project_id", projectId)
      .order("status")
      .order("created_at"),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
  ]);

  const list = decisions ?? [];
  const roomList = rooms ?? [];

  async function addDecision(formData: FormData) {
    "use server";
    await upsertDecision(projectId, formData);
  }

  async function updateDecisionStatus(id: string, status: string, formData: FormData) {
    "use server";
    formData.set("id", id);
    formData.set("status", status);
    await upsertDecision(projectId, formData);
  }

  const byStatus: Record<string, typeof list> = {
    NOT_STARTED: list.filter((d) => d.status === "NOT_STARTED"),
    RESEARCH: list.filter((d) => d.status === "RESEARCH"),
    SHORTLIST: list.filter((d) => d.status === "SHORTLIST"),
    DECIDED: list.filter((d) => d.status === "DECIDED"),
  };

  return (
    <>
      <PageHeader
        title="Decyzje"
        description={`${list.filter((d) => d.status !== "DECIDED").length} otwartych z ${list.length}`}
      />

      {/* Formularz */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj decyzję</h2>
        <form action={addDecision} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Tytuł *" className="sm:col-span-2">
            <Input name="title" required placeholder="np. Wybór płytek do łazienki" />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="NOT_STARTED">
              {Object.entries(labels.decisionStatus).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Pomieszczenie">
            <Select name="room_id" defaultValue="">
              <option value="">— brak —</option>
              {roomList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="Opis" className="sm:col-span-2">
            <Textarea name="description" rows={2} placeholder="Kontekst decyzji…" />
          </Field>
          <Field label="Wybrana opcja">
            <Input name="selected_option" placeholder="np. Płytki Tubądzin 60×60" />
          </Field>
          <Field label="Notatki">
            <Input name="notes" placeholder="Dodatkowe uwagi…" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="requires_approval" className="h-4 w-4 rounded border-border" />
              Wymaga zatwierdzenia
            </label>
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Dodaj decyzję
            </Button>
          </div>
        </form>
      </Card>

      {/* Lista po statusach */}
      {!list.length ? (
        <EmptyState title="Brak decyzji" description="Dodaj pierwszą decyzję powyżej." className="mt-6" />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(["NOT_STARTED", "RESEARCH", "SHORTLIST", "DECIDED"] as const).map((status) => (
            <div key={status}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">{labelFor(labels.decisionStatus, status)}</span>
                <Badge variant={statusVariant(status)}>{byStatus[status].length}</Badge>
              </div>
              <div className="space-y-2">
                {byStatus[status].map((d) => {
                  const roomName = roomList.find((r) => r.id === d.room_id)?.name;
                  return (
                    <Card key={d.id} className="p-3 flex flex-col gap-2">
                      <p className="text-sm font-medium">{d.title}</p>
                      {roomName && <Badge variant="gray" className="w-fit">{roomName}</Badge>}
                      {d.selected_option && (
                        <p className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">
                          ✓ {d.selected_option}
                        </p>
                      )}
                      {d.requires_approval && (
                        <Badge variant="amber" className="w-fit">Wymaga zatwierdzenia</Badge>
                      )}
                      <div className="flex gap-2 mt-1">
                        <DeleteButton
                          action={deleteDecision.bind(null, projectId)}
                          id={d.id}
                          confirmMessage={`Usuń decyzję "${d.title}"?`}
                          size="sm"
                        />
                      </div>
                    </Card>
                  );
                })}
                {!byStatus[status].length && (
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
