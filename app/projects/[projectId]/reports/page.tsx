import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireProject } from "@/lib/data";
import { computeNextActions } from "@/lib/next-actions";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { labelFor, labels, statusVariant } from "@/lib/labels";
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import Link from "next/link";

function ProgressBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase, project } = await requireProject(projectId);

  const [
    { data: tasks },
    { data: budget },
    { data: scheduleItems },
    { data: decisions },
    { data: payments },
    { data: activityEntries },
    actions,
  ] = await Promise.all([
    supabase.from("tasks").select("status,priority").eq("project_id", projectId),
    supabase.from("budget_items").select("planned_cost,actual_cost,status").eq("project_id", projectId),
    supabase.from("schedule_items").select("status,title").eq("project_id", projectId),
    supabase.from("decisions").select("status").eq("project_id", projectId),
    supabase.from("payments").select("amount,status,planned_date").eq("project_id", projectId),
    supabase.from("activity_log").select("description,entity_type,action,created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(5),
    computeNextActions(projectId, supabase),
  ]);

  // Zadania
  const taskList = tasks ?? [];
  const taskDone = taskList.filter((t) => t.status === "DONE").length;
  const taskOpen = taskList.filter((t) => t.status !== "DONE").length;
  const taskBlocked = taskList.filter((t) => t.status === "BLOCKED").length;

  // Budżet
  const budgetList = budget ?? [];
  const planned = budgetList.reduce((s, b) => s + Number(b.planned_cost ?? 0), 0);
  const actual = budgetList.reduce((s, b) => s + Number(b.actual_cost ?? 0), 0);
  const target = Number(project.target_budget ?? 0);
  const budgetUsedPct = planned > 0 ? Math.round((actual / planned) * 100) : 0;

  // Harmonogram
  const scheduleList = scheduleItems ?? [];
  const scheduleDone = scheduleList.filter((s) => s.status === "DONE").length;
  const scheduleDelayed = scheduleList.filter((s) => s.status === "DELAYED").length;

  // Decyzje
  const decisionList = decisions ?? [];
  const decisionsDecided = decisionList.filter((d) => d.status === "DECIDED").length;

  // Płatności
  const paymentList = payments ?? [];
  const paymentOverdue = paymentList.filter((p) => p.status === "OVERDUE").length;
  const paymentDue = paymentList.filter((p) => p.status === "DUE").length;
  const paymentPaid = paymentList.reduce((s, p) => p.status === "PAID" ? s + Number(p.amount ?? 0) : s, 0);
  const paymentPlanned = paymentList.reduce((s, p) => s + Number(p.amount ?? 0), 0);

  // Priorytety
  const critical = actions.filter((a) => a.urgency === "critical");
  const high = actions.filter((a) => a.urgency === "high");

  return (
    <>
      <PageHeader
        title="Raporty"
        description={`Podsumowanie projektu: ${project.name}`}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Zadania */}
        <Card>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Zadania</p>
          <p className="text-3xl font-bold">{taskDone}<span className="text-lg text-muted-foreground font-normal">/{taskList.length}</span></p>
          <p className="text-xs text-muted-foreground mb-2">ukończonych</p>
          <ProgressBar value={taskDone} max={taskList.length} color="bg-green-500" />
          {taskBlocked > 0 && <p className="text-xs text-amber-600 mt-1">{taskBlocked} zablokowanych</p>}
        </Card>

        {/* Budżet */}
        <Card>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Budżet</p>
          <p className="text-3xl font-bold">{budgetUsedPct}%</p>
          <p className="text-xs text-muted-foreground mb-2">{formatCurrency(actual)} z {formatCurrency(planned)}</p>
          <ProgressBar value={actual} max={planned} color={budgetUsedPct > 90 ? "bg-red-500" : budgetUsedPct > 70 ? "bg-amber-500" : "bg-green-500"} />
          {target > 0 && (
            <p className={`text-xs mt-1 ${actual > target ? "text-red-600" : "text-muted-foreground"}`}>
              {actual > target ? `Przekroczono o ${formatCurrency(actual - target)}` : `Pozostało ${formatCurrency(target - actual)}`}
            </p>
          )}
        </Card>

        {/* Harmonogram */}
        <Card>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Harmonogram</p>
          <p className="text-3xl font-bold">{scheduleDone}<span className="text-lg text-muted-foreground font-normal">/{scheduleList.length}</span></p>
          <p className="text-xs text-muted-foreground mb-2">etapów ukończonych</p>
          <ProgressBar value={scheduleDone} max={scheduleList.length} color="bg-blue-500" />
          {scheduleDelayed > 0 && <p className="text-xs text-red-600 mt-1">{scheduleDelayed} opóźnionych</p>}
        </Card>

        {/* Decyzje */}
        <Card>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Decyzje</p>
          <p className="text-3xl font-bold">{decisionsDecided}<span className="text-lg text-muted-foreground font-normal">/{decisionList.length}</span></p>
          <p className="text-xs text-muted-foreground mb-2">podjętych decyzji</p>
          <ProgressBar value={decisionsDecided} max={decisionList.length} color="bg-purple-500" />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Pilne sprawy */}
        <Card>
          <h2 className="font-semibold mb-3">Pilne sprawy ({critical.length + high.length})</h2>
          {!critical.length && !high.length ? (
            <p className="text-sm text-muted-foreground">Brak pilnych spraw 🎉</p>
          ) : (
            <div className="space-y-2">
              {[...critical, ...high].slice(0, 8).map((a, i) => {
                const Icon = a.urgency === "critical" ? AlertCircle : AlertTriangle;
                const color = a.urgency === "critical" ? "text-red-500" : "text-amber-500";
                return (
                  <Link key={i} href={a.href} className="flex items-start gap-2 rounded-md p-2 hover:bg-muted transition-colors">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.category}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Płatności */}
        <Card>
          <h2 className="font-semibold mb-3">Płatności</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Opłacono</span>
              <span className="font-medium">{formatCurrency(paymentPaid)}</span>
            </div>
            <ProgressBar value={paymentPaid} max={paymentPlanned} color="bg-green-500" />
            <div className="flex gap-3 flex-wrap">
              {paymentOverdue > 0 && (
                <Badge variant="red">{paymentOverdue} przeterminowanych</Badge>
              )}
              {paymentDue > 0 && (
                <Badge variant="amber">{paymentDue} do zapłaty</Badge>
              )}
              {!paymentOverdue && !paymentDue && (
                <Badge variant="green">Płatności OK</Badge>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Ostatnia aktywność */}
      {activityEntries && activityEntries.length > 0 && (
        <Card className="mt-4">
          <h2 className="font-semibold mb-3">Ostatnia aktywność</h2>
          <div className="space-y-2">
            {activityEntries.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p>{e.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(e.created_at.slice(0, 10))}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Link href={`/projects/${projectId}/activity`} className="text-xs text-primary hover:underline">
              Zobacz całą historię →
            </Link>
          </div>
        </Card>
      )}
    </>
  );
}
