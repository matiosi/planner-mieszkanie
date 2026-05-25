import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/delete-button";
import { requireProject } from "@/lib/data";
import {
  createChecklist, createFromTemplate, deleteChecklist,
  toggleChecklistItem, addChecklistItem, deleteChecklistItem,
} from "@/app/actions/checklist";
import { Plus, CheckSquare, Square, Wand2 } from "lucide-react";

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: checklists }, { data: items }, { data: templates }, { data: rooms }] = await Promise.all([
    supabase.from("checklists").select("id,name,room_id,created_at").eq("project_id", projectId).order("created_at"),
    supabase.from("checklist_items").select("id,checklist_id,title,done,sort_order").eq("project_id", projectId).order("sort_order"),
    supabase.from("checklist_templates").select("id,name,items").order("name"),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
  ]);

  const checklistList = checklists ?? [];
  const itemList = items ?? [];
  const templateList = templates ?? [];
  const roomList = rooms ?? [];

  const itemsFor = (checklistId: string) => itemList.filter((i) => i.checklist_id === checklistId);

  return (
    <>
      <PageHeader
        title="Checklistry"
        description="Śledź postęp prac — twórz listy z szablonów lub od zera."
      />

      {/* Sekcja szablonów */}
      {templateList.length > 0 && (
        <Card className="mt-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Wand2 className="h-4 w-4" /> Utwórz z szablonu
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {templateList.map((t) => {
              const itemCount = (t.items as string[]).length;
              return (
                <form key={t.id} action={createFromTemplate.bind(null, projectId)}>
                  <input type="hidden" name="template_id" value={t.id} />
                  <button
                    type="submit"
                    className="w-full text-left rounded-md border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors px-3 py-2.5 group"
                  >
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{itemCount} pozycji</p>
                  </button>
                </form>
              );
            })}
          </div>
        </Card>
      )}

      {/* Nowa checklista od zera */}
      <Card className="mt-4">
        <h2 className="font-semibold mb-3">Nowa checklista</h2>
        <form action={createChecklist.bind(null, projectId)} className="flex gap-3 flex-wrap">
          <Field label="Nazwa *" className="flex-1 min-w-48">
            <Input name="name" required placeholder="np. Lista odbioru łazienki" />
          </Field>
          <Field label="Pomieszczenie">
            <Select name="room_id" defaultValue="">
              <option value="">— brak —</option>
              {roomList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Utwórz
            </Button>
          </div>
        </form>
      </Card>

      {/* Lista checklisty */}
      {!checklistList.length ? (
        <EmptyState
          title="Brak checklisty"
          description="Utwórz checklistę z szablonu lub od zera powyżej."
          className="mt-6"
        />
      ) : (
        <div className="mt-6 space-y-4">
          {checklistList.map((cl) => {
            const clItems = itemsFor(cl.id);
            const doneCount = clItems.filter((i) => i.done).length;
            const total = clItems.length;
            const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
            const room = roomList.find((r) => r.id === cl.room_id);

            return (
              <Card key={cl.id}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{cl.name}</h3>
                      {room && <Badge variant="gray">{room.name}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {doneCount}/{total} — {percent}% ukończone
                    </p>
                  </div>
                  <DeleteButton
                    action={deleteChecklist.bind(null, projectId)}
                    id={cl.id}
                    confirmMessage={`Usuń checklistę "${cl.name}"?`}
                    size="sm"
                  />
                </div>

                {/* Progress bar */}
                {total > 0 && (
                  <div className="h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}

                {/* Items */}
                <div className="space-y-1 mb-3">
                  {clItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 group">
                      <form action={toggleChecklistItem.bind(null, projectId)} className="flex items-center gap-2 flex-1 min-w-0">
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="done" value={item.done ? "false" : "true"} />
                        <button type="submit" className="shrink-0 text-primary hover:scale-110 transition-transform">
                          {item.done
                            ? <CheckSquare className="h-4 w-4" />
                            : <Square className="h-4 w-4 text-muted-foreground" />
                          }
                        </button>
                        <span className={`text-sm truncate ${item.done ? "line-through text-muted-foreground" : ""}`}>
                          {item.title}
                        </span>
                      </form>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <DeleteButton
                          action={deleteChecklistItem.bind(null, projectId)}
                          id={item.id}
                          confirmMessage="Usuń tę pozycję?"
                          size="sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dodaj pozycję */}
                <form action={addChecklistItem.bind(null, projectId)} className="flex gap-2">
                  <input type="hidden" name="checklist_id" value={cl.id} />
                  <Input name="title" placeholder="Dodaj pozycję…" className="flex-1 h-8 text-sm" />
                  <Button type="submit" variant="secondary" size="sm">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
