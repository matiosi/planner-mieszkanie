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
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { requireProject } from "@/lib/data";
import { upsertBudgetItem, deleteBudgetItem } from "@/app/actions/budget";
import { Plus, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase, project } = await requireProject(projectId);

  const [{ data: items }, { data: rooms }] = await Promise.all([
    supabase
      .from("budget_items")
      .select("id,name,category,planned_cost,actual_cost,status,unexpected_cost,room_id,notes")
      .eq("project_id", projectId)
      .order("category")
      .order("name"),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
  ]);

  const list = items ?? [];
  const roomList = rooms ?? [];
  const totalPlanned = list.reduce((s, i) => s + Number(i.planned_cost ?? 0), 0);
  const totalActual = list.reduce((s, i) => s + Number(i.actual_cost ?? 0), 0);
  const target = Number(project.target_budget ?? 0);

  // Grupuj po kategorii
  const byCategory = list.reduce<Record<string, typeof list>>((acc, item) => {
    const cat = item.category ?? "OTHER";
    acc[cat] = acc[cat] ?? [];
    acc[cat].push(item);
    return acc;
  }, {});

  async function addItem(formData: FormData) {
    "use server";
    await upsertBudgetItem(projectId, formData);
  }

  return (
    <>
      <PageHeader
        title="Budżet"
        description="Planuj i śledź koszty projektu."
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={`/projects/${projectId}/budget/scenarios`}>Warianty budżetu</Link>
          </Button>
        }
      />

      {/* KPI */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-xs text-muted-foreground">Budżet docelowy</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(target)}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Planowany</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(totalPlanned)}</p>
          {target > 0 && <p className="text-xs text-muted-foreground">{formatPercent(totalPlanned, target)} budżetu</p>}
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Rzeczywisty</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(totalActual)}</p>
          {totalPlanned > 0 && <p className="text-xs text-muted-foreground">{formatPercent(totalActual, totalPlanned)} planu</p>}
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Pozostało</p>
          <p className={`mt-1 text-xl font-semibold ${target - totalActual < 0 ? "text-destructive" : ""}`}>
            {formatCurrency(target - totalActual)}
          </p>
          {totalPlanned > target && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertTriangle className="h-3 w-3" /> Plan przekracza budżet
            </p>
          )}
        </Card>
      </div>

      {/* Dodaj pozycję */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj pozycję budżetu</h2>
        <form action={addItem} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Nazwa *">
            <Input name="name" required placeholder="np. Kuchnia na wymiar" />
          </Field>
          <Field label="Kategoria">
            <Select name="category" defaultValue="OTHER">
              {Object.entries(labels.budgetCategory).map(([v, l]) => (
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
          <Field label="Status">
            <Select name="status" defaultValue="PLANNED">
              {Object.entries(labels.budgetStatus).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Koszt planowany (PLN)">
            <Input name="planned_cost" type="number" step="100" placeholder="0" />
          </Field>
          <Field label="Koszt rzeczywisty (PLN)">
            <Input name="actual_cost" type="number" step="100" placeholder="0" />
          </Field>
          <Field label="Notatki" className="sm:col-span-2">
            <Input name="notes" placeholder="Opcjonalne notatki" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="unexpected_cost" className="h-4 w-4 rounded border-border" />
              Koszt niespodziewany
            </label>
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Dodaj
            </Button>
          </div>
        </form>
      </Card>

      {/* Tabela po kategorii */}
      {!list.length ? (
        <EmptyState title="Brak pozycji budżetu" description="Dodaj pierwszą pozycję powyżej." className="mt-6" />
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(byCategory).map(([cat, catItems]) => {
            const catPlanned = catItems.reduce((s, i) => s + Number(i.planned_cost ?? 0), 0);
            const catActual = catItems.reduce((s, i) => s + Number(i.actual_cost ?? 0), 0);
            return (
              <Card key={cat}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{labelFor(labels.budgetCategory, cat)}</h3>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Plan: {formatCurrency(catPlanned)}</span>
                    <span>Rzecz.: {formatCurrency(catActual)}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Nazwa</th>
                        <th className="pb-2 font-medium text-right">Planowany</th>
                        <th className="pb-2 font-medium text-right">Rzeczywisty</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {catItems.map((item) => (
                        <tr key={item.id} className="border-b border-border/50 last:border-0">
                          <td className="py-2">
                            {item.name}
                            {item.unexpected_cost && (
                              <span className="ml-1 text-xs text-amber-600">★</span>
                            )}
                          </td>
                          <td className="py-2 text-right">{formatCurrency(item.planned_cost)}</td>
                          <td className="py-2 text-right">
                            <span className={item.actual_cost && item.planned_cost && item.actual_cost > item.planned_cost ? "text-destructive" : ""}>
                              {formatCurrency(item.actual_cost)}
                            </span>
                          </td>
                          <td className="py-2">
                            <Badge variant={statusVariant(item.status)}>
                              {labelFor(labels.budgetStatus, item.status)}
                            </Badge>
                          </td>
                          <td className="py-2 text-right">
                            <DeleteButton
                              action={deleteBudgetItem.bind(null, projectId)}
                              id={item.id}
                              confirmMessage={`Usuń pozycję "${item.name}"?`}
                              size="sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
