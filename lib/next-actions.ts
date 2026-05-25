import { SupabaseClient } from "@supabase/supabase-js";

export interface NextAction {
  priority: number;
  category: string;
  title: string;
  description: string;
  href: string;
  urgency: "critical" | "high" | "medium" | "low";
}

export async function computeNextActions(
  projectId: string,
  supabase: SupabaseClient
): Promise<NextAction[]> {
  const today = new Date().toISOString().split("T")[0];
  const in7days = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const [
    { data: payments },
    { data: tasks },
    { data: decisions },
    { data: budgetItems },
    { data: punchList },
    { data: products },
    { data: planDiffs },
    { data: rooms },
    { data: questions },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("id,title,amount,status,planned_date")
      .eq("project_id", projectId)
      .in("status", ["OVERDUE", "DUE"]),
    supabase
      .from("tasks")
      .select("id,title,status,due_date,priority")
      .eq("project_id", projectId)
      .in("status", ["TODO", "IN_PROGRESS", "BLOCKED"]),
    supabase
      .from("decisions")
      .select("id,title,status,requires_approval")
      .eq("project_id", projectId)
      .not("status", "eq", "DECIDED"),
    supabase
      .from("budget_items")
      .select("id,name,planned_cost,actual_cost,category")
      .eq("project_id", projectId),
    supabase
      .from("punch_list_items")
      .select("id,title,severity,status")
      .eq("project_id", projectId)
      .not("status", "in", '("FIXED","ACCEPTED")'),
    supabase
      .from("products")
      .select("id,name,delivery_status,expected_delivery_date")
      .eq("project_id", projectId)
      .eq("delivery_status", "DELAYED"),
    supabase
      .from("plan_differences")
      .select("id,title,status")
      .eq("project_id", projectId)
      .eq("status", "NEEDS_DISCUSSION"),
    supabase
      .from("rooms")
      .select("id,name,status")
      .eq("project_id", projectId),
    supabase
      .from("questions")
      .select("id,question,status,due_date")
      .eq("project_id", projectId)
      .in("status", ["OPEN", "NEEDS_FOLLOW_UP"]),
  ]);

  const actions: NextAction[] = [];

  // 1. Overdue payments (priority 1)
  const overduePayments = (payments ?? []).filter((p) => p.status === "OVERDUE");
  if (overduePayments.length > 0) {
    actions.push({
      priority: 1,
      category: "Płatności",
      urgency: "critical",
      title: `${overduePayments.length} zaległa płatność${overduePayments.length > 1 ? "i" : ""}`,
      description: overduePayments.slice(0, 2).map((p) => p.title).join(", "),
      href: `/projects/${projectId}/payments`,
    });
  }

  // 2. Critical punch list items (priority 2)
  const criticalIssues = (punchList ?? []).filter((p) => p.severity === "CRITICAL");
  if (criticalIssues.length > 0) {
    actions.push({
      priority: 2,
      category: "Usterki",
      urgency: "critical",
      title: `${criticalIssues.length} krytyczna usterka${criticalIssues.length > 1 ? "i" : ""}`,
      description: criticalIssues.slice(0, 2).map((p) => p.title).join(", "),
      href: `/projects/${projectId}/punch-list`,
    });
  }

  // 3. Blocked tasks (priority 3)
  const blockedTasks = (tasks ?? []).filter((t) => t.status === "BLOCKED");
  if (blockedTasks.length > 0) {
    actions.push({
      priority: 3,
      category: "Zadania",
      urgency: "high",
      title: `${blockedTasks.length} zablokowane zadanie${blockedTasks.length > 1 ? "a" : ""}`,
      description: blockedTasks.slice(0, 2).map((t) => t.title).join(", "),
      href: `/projects/${projectId}/tasks`,
    });
  }

  // 4. Pending approvals (priority 4)
  const needsApproval = (decisions ?? []).filter((d) => d.requires_approval && d.status !== "DECIDED");
  if (needsApproval.length > 0) {
    actions.push({
      priority: 4,
      category: "Decyzje",
      urgency: "high",
      title: `${needsApproval.length} decyzja${needsApproval.length > 1 ? "e" : ""} do zatwierdzenia`,
      description: needsApproval.slice(0, 2).map((d) => d.title).join(", "),
      href: `/projects/${projectId}/decisions`,
    });
  }

  // 5. Overdue tasks (priority 5)
  const overdueTasks = (tasks ?? []).filter(
    (t) => t.due_date && t.due_date < today && t.status !== "DONE"
  );
  if (overdueTasks.length > 0) {
    actions.push({
      priority: 5,
      category: "Zadania",
      urgency: "high",
      title: `${overdueTasks.length} zaległe zadanie${overdueTasks.length > 1 ? "a" : ""}`,
      description: `Termin minął: ${overdueTasks.slice(0, 2).map((t) => t.title).join(", ")}`,
      href: `/projects/${projectId}/tasks`,
    });
  }

  // 6. Tasks due in 7 days (priority 5.5)
  const upcomingTasks = (tasks ?? []).filter(
    (t) => t.due_date && t.due_date >= today && t.due_date <= in7days && t.status !== "DONE"
  );
  if (upcomingTasks.length > 0) {
    actions.push({
      priority: 6,
      category: "Zadania",
      urgency: "medium",
      title: `${upcomingTasks.length} zadanie${upcomingTasks.length > 1 ? "a" : ""} w tym tygodniu`,
      description: upcomingTasks.slice(0, 2).map((t) => t.title).join(", "),
      href: `/projects/${projectId}/tasks`,
    });
  }

  // 7. Open decisions (priority 7)
  const openDecisions = (decisions ?? []).filter((d) => d.status === "NOT_STARTED" || d.status === "RESEARCH");
  if (openDecisions.length > 0) {
    actions.push({
      priority: 7,
      category: "Decyzje",
      urgency: "medium",
      title: `${openDecisions.length} otwarta decyzja${openDecisions.length > 1 ? "e" : ""}`,
      description: openDecisions.slice(0, 2).map((d) => d.title).join(", "),
      href: `/projects/${projectId}/decisions`,
    });
  }

  // 8. Budget overrun (priority 8)
  const budgetList = budgetItems ?? [];
  const totalPlanned = budgetList.reduce((s, b) => s + (b.planned_cost ?? 0), 0);
  const totalActual = budgetList.reduce((s, b) => s + (b.actual_cost ?? 0), 0);
  if (totalPlanned > 0 && totalActual > totalPlanned * 1.05) {
    const overrun = totalActual - totalPlanned;
    actions.push({
      priority: 8,
      category: "Budżet",
      urgency: "high",
      title: "Budżet przekroczony",
      description: `Rzeczywiste koszty są o ${Math.round((overrun / totalPlanned) * 100)}% wyższe niż planowane`,
      href: `/projects/${projectId}/budget`,
    });
  }

  // 9. Due payments (priority 9)
  const duePayments = (payments ?? []).filter((p) => p.status === "DUE");
  if (duePayments.length > 0) {
    actions.push({
      priority: 9,
      category: "Płatności",
      urgency: "medium",
      title: `${duePayments.length} płatność${duePayments.length > 1 ? "i" : ""} do zapłaty`,
      description: duePayments.slice(0, 2).map((p) => p.title).join(", "),
      href: `/projects/${projectId}/payments`,
    });
  }

  // 10. Plan differences (priority 10)
  if ((planDiffs ?? []).length > 0) {
    actions.push({
      priority: 10,
      category: "Plany",
      urgency: "medium",
      title: `${planDiffs!.length} różnica${planDiffs!.length > 1 ? "e" : ""} do omówienia`,
      description: planDiffs!.slice(0, 2).map((d) => d.title).join(", "),
      href: `/projects/${projectId}/plans/compare`,
    });
  }

  // 11. Delayed deliveries (priority 11)
  if ((products ?? []).length > 0) {
    actions.push({
      priority: 11,
      category: "Dostawy",
      urgency: "medium",
      title: `${products!.length} opóźniona dostawa${products!.length > 1 ? "y" : ""}`,
      description: products!.slice(0, 2).map((p) => p.name).join(", "),
      href: `/projects/${projectId}/deliveries`,
    });
  }

  // 12. Rooms without any items (no inspiration, no products) (priority 12)
  const roomList = rooms ?? [];
  if (roomList.length === 0) {
    actions.push({
      priority: 12,
      category: "Projekt",
      urgency: "low",
      title: "Dodaj pomieszczenia",
      description: "Projekt nie ma jeszcze żadnych pomieszczeń",
      href: `/projects/${projectId}/rooms`,
    });
  }

  // 13. Open questions overdue (priority 13)
  const overdueQuestions = (questions ?? []).filter(
    (q) => q.due_date && q.due_date < today
  );
  if (overdueQuestions.length > 0) {
    actions.push({
      priority: 13,
      category: "Pytania",
      urgency: "medium",
      title: `${overdueQuestions.length} pytanie${overdueQuestions.length > 1 ? "a" : ""} bez odpowiedzi`,
      description: overdueQuestions.slice(0, 2).map((q) => q.question).join(", "),
      href: `/projects/${projectId}/questions`,
    });
  }

  // 14. High punch list items (priority 14)
  const highIssues = (punchList ?? []).filter((p) => p.severity === "HIGH");
  if (highIssues.length > 0 && criticalIssues.length === 0) {
    actions.push({
      priority: 14,
      category: "Usterki",
      urgency: "medium",
      title: `${highIssues.length} usterka${highIssues.length > 1 ? "i" : ""} o wysokim priorytecie`,
      description: highIssues.slice(0, 2).map((p) => p.title).join(", "),
      href: `/projects/${projectId}/punch-list`,
    });
  }

  return actions.sort((a, b) => a.priority - b.priority).slice(0, 12);
}
