import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { requireProject } from "@/lib/data";
import { CashflowChart } from "@/components/cashflow-chart";

export default async function CashflowPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase, project } = await requireProject(projectId);

  const [{ data: payments }, { data: budgetItems }] = await Promise.all([
    supabase
      .from("payments")
      .select("id,title,amount,status,planned_date,paid_date")
      .eq("project_id", projectId)
      .not("status", "eq", "CANCELLED")
      .order("planned_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("budget_items")
      .select("id,name,planned_cost,actual_cost,status")
      .eq("project_id", projectId),
  ]);

  const paymentList = payments ?? [];
  const budgetList = budgetItems ?? [];

  const totalPaid = paymentList
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalPlannedPayments = paymentList.reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalBudget = budgetList.reduce((s, b) => s + (b.planned_cost ?? 0), 0);
  const totalActual = budgetList.reduce((s, b) => s + (b.actual_cost ?? 0), 0);

  // Aggregate by month for chart
  const monthlyData = paymentList.reduce<Record<string, { planned: number; paid: number }>>((acc, p) => {
    const date = p.paid_date || p.planned_date;
    if (!date) return acc;
    const key = date.slice(0, 7); // YYYY-MM
    if (!acc[key]) acc[key] = { planned: 0, paid: 0 };
    acc[key].planned += p.amount ?? 0;
    if (p.status === "PAID") acc[key].paid += p.amount ?? 0;
    return acc;
  }, {});

  const chartData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      planned: data.planned,
      paid: data.paid,
    }));

  const remaining = (project.target_budget ?? 0) - totalActual;

  return (
    <>
      <PageHeader
        title="Cashflow"
        description="Przepływ pieniędzy w projekcie"
      />

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-xs text-muted-foreground">Budżet projektu</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(project.target_budget ?? 0)}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Wydano</p>
          <p className="text-xl font-bold mt-1 text-red-600">{formatCurrency(totalActual)}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Pozostało</p>
          <p className={`text-xl font-bold mt-1 ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(remaining)}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Zapłacone faktury</p>
          <p className="text-xl font-bold mt-1 text-green-600">{formatCurrency(totalPaid)}</p>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="mt-6">
          <h2 className="font-semibold mb-4">Miesięczne wydatki</h2>
          <CashflowChart data={chartData} />
        </Card>
      )}

      {/* Payment timeline */}
      {!paymentList.length ? (
        <EmptyState
          title="Brak płatności"
          description="Dodaj płatności w module Płatności."
          className="mt-6"
        />
      ) : (
        <Card className="mt-6">
          <h2 className="font-semibold mb-4">Harmonogram płatności</h2>
          <div className="space-y-2">
            {paymentList.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.paid_date ? `Zapłacono: ${formatDate(p.paid_date)}` :
                     p.planned_date ? `Planowane: ${formatDate(p.planned_date)}` : "Brak daty"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm">{formatCurrency(p.amount ?? 0)}</p>
                  <Badge variant={p.status === "PAID" ? "green" : p.status === "OVERDUE" ? "red" : "gray"}>
                    {p.status === "PAID" ? "Zapłacono" : p.status === "OVERDUE" ? "Po terminie" : "Planowane"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between">
            <span className="font-semibold">Łącznie planowane</span>
            <span className="font-bold">{formatCurrency(totalPlannedPayments)}</span>
          </div>
        </Card>
      )}
    </>
  );
}
