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
import { formatCurrency } from "@/lib/formatters";
import { requireProject } from "@/lib/data";
import { upsertDecision, deleteDecision } from "@/app/actions/decisions";
import { upsertAlternative, deleteAlternative, selectAlternative } from "@/app/actions/alternatives";
import { Plus, Link as LinkIcon, CheckCircle2 } from "lucide-react";

export default async function DecisionsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: decisions }, { data: rooms }, { data: alternatives }] = await Promise.all([
    supabase
      .from("decisions")
      .select("id,title,description,status,selected_option,notes,room_id,requires_approval")
      .eq("project_id", projectId)
      .order("status")
      .order("created_at"),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
    supabase
      .from("alternatives")
      .select("id,decision_id,name,url,price,pros,cons,selected")
      .eq("project_id", projectId)
      .order("created_at"),
  ]);

  const list = decisions ?? [];
  const roomList = rooms ?? [];
  const altList = alternatives ?? [];

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
        <form action={upsertDecision.bind(null, projectId)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  const decisionAlts = altList.filter((a) => a.decision_id === d.id);
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

                      {/* Alternatywy */}
                      {decisionAlts.length > 0 && (
                        <div className="border-t border-border pt-2 space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground">Alternatywy:</p>
                          {decisionAlts.map((alt) => (
                            <div key={alt.id} className={`rounded px-2 py-1.5 text-xs flex items-start gap-2 ${alt.selected ? "bg-green-50 border border-green-200" : "bg-muted/50"}`}>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{alt.name}</p>
                                {alt.price && <p className="text-muted-foreground">{formatCurrency(alt.price)}</p>}
                                {alt.pros && <p className="text-green-700">+ {alt.pros}</p>}
                                {alt.cons && <p className="text-red-600">− {alt.cons}</p>}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {alt.url && (
                                  <a href={alt.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                                    <LinkIcon className="h-3 w-3" />
                                  </a>
                                )}
                                {!alt.selected && (
                                  <form action={selectAlternative.bind(null, projectId)}>
                                    <input type="hidden" name="id" value={alt.id} />
                                    <input type="hidden" name="decision_id" value={d.id} />
                                    <button type="submit" title="Wybierz tę opcję" className="text-muted-foreground hover:text-green-600 transition-colors">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    </button>
                                  </form>
                                )}
                                <DeleteButton
                                  action={deleteAlternative.bind(null, projectId)}
                                  id={alt.id}
                                  confirmMessage="Usuń alternatywę?"
                                  size="sm"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Formularz dodania alternatywy */}
                      <details className="border-t border-border pt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none">
                          + Dodaj alternatywę
                        </summary>
                        <form action={upsertAlternative.bind(null, projectId)} className="mt-2 space-y-1.5">
                          <input type="hidden" name="decision_id" value={d.id} />
                          <Input name="name" placeholder="Nazwa opcji *" required className="h-7 text-xs" />
                          <div className="grid grid-cols-2 gap-1.5">
                            <Input name="price" type="number" placeholder="Cena (PLN)" className="h-7 text-xs" />
                            <Input name="url" type="url" placeholder="Link" className="h-7 text-xs" />
                          </div>
                          <Input name="pros" placeholder="Za (zalety)" className="h-7 text-xs" />
                          <Input name="cons" placeholder="Przeciw (wady)" className="h-7 text-xs" />
                          <Button type="submit" variant="secondary" size="sm" className="w-full h-7 text-xs">
                            Dodaj
                          </Button>
                        </form>
                      </details>

                      <div className="flex gap-2 mt-1 border-t border-border pt-2">
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
