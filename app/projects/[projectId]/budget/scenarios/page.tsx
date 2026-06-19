import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DeleteButton } from "@/components/delete-button";
import { requireProject } from "@/lib/data";
import { formatCurrency } from "@/lib/formatters";
import { upsertBudgetScenario, deleteBudgetScenario } from "@/app/actions/budget-scenarios";

export default async function BudgetScenariosPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);
  const [{ data: scenarios }, { data: items }] = await Promise.all([
    supabase.from("budget_scenarios").select("id,name,is_active,created_at").eq("project_id", projectId).order("created_at"),
    supabase.from("budget_items").select("scenario_id,planned_cost,actual_cost").eq("project_id", projectId),
  ]);

  const budgetItems = items ?? [];
  const totals = new Map<string, { planned: number; actual: number; count: number }>();
  for (const item of budgetItems) {
    const key = item.scenario_id ?? "main";
    const current = totals.get(key) ?? { planned: 0, actual: 0, count: 0 };
    current.planned += Number(item.planned_cost ?? 0);
    current.actual += Number(item.actual_cost ?? 0);
    current.count += 1;
    totals.set(key, current);
  }

  return (
    <>
      <PageHeader title="Warianty budżetu" description="Porównaj scenariusze kosztów projektu." />

      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Nowy scenariusz</h2>
        <form action={upsertBudgetScenario.bind(null, projectId)} className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
          <Field label="Nazwa">
            <Input name="name" required placeholder="np. Minimum, Standard, Premium" />
          </Field>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" name="is_active" className="h-4 w-4 rounded border-border" />
            Aktywny
          </label>
          <div className="flex items-end">
            <Button type="submit" size="sm">Dodaj</Button>
          </div>
        </form>
      </Card>

      <div className="mt-6 grid gap-3">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Budżet główny</h2>
                <Badge variant="gray">Bez scenariusza</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {(totals.get("main")?.count ?? 0)} pozycji · Plan {formatCurrency(totals.get("main")?.planned ?? 0)} · Rzeczywiste {formatCurrency(totals.get("main")?.actual ?? 0)}
              </p>
            </div>
          </div>
        </Card>

        {(scenarios ?? []).map((scenario) => {
          const total = totals.get(scenario.id) ?? { planned: 0, actual: 0, count: 0 };
          return (
            <Card key={scenario.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{scenario.name}</h2>
                    {scenario.is_active && <Badge variant="green">Aktywny</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {total.count} pozycji · Plan {formatCurrency(total.planned)} · Rzeczywiste {formatCurrency(total.actual)}
                  </p>
                </div>
                <DeleteButton
                  action={deleteBudgetScenario.bind(null, projectId)}
                  id={scenario.id}
                  confirmMessage={`Usunąć scenariusz "${scenario.name}"? Pozycje wrócą do budżetu głównego.`}
                  size="sm"
                />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
