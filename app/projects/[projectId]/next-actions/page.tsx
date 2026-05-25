import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getDashboard } from "@/lib/data";

export default async function NextActionsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { rooms, budget, tasks, decisions, products, inspirations, differences } = await getDashboard(projectId);
  const today = new Date().toISOString().slice(0, 10);
  const actions = [
    ...tasks.filter((task) => task.status !== "DONE" && task.due_date && task.due_date < today).map((task) => ({
      title: task.title,
      reason: `Termin minął: ${formatDate(task.due_date)}`,
      href: `/projects/${projectId}/tasks`,
      priority: "Wysoka"
    })),
    ...tasks.filter((task) => task.status === "BLOCKED").map((task) => ({
      title: task.title,
      reason: task.blocked_by ? `Zablokowane przez: ${task.blocked_by}` : "Zadanie jest zablokowane",
      href: `/projects/${projectId}/tasks`,
      priority: "Wysoka"
    })),
    ...decisions.filter((decision) => decision.status !== "DECIDED").slice(0, 5).map((decision) => ({
      title: decision.title,
      reason: "Decyzja jest nadal otwarta",
      href: `/projects/${projectId}/decisions`,
      priority: "Średnia"
    })),
    ...budget.filter((item) => Number(item.actual_cost ?? 0) > Number(item.planned_cost ?? 0) && Number(item.planned_cost ?? 0) > 0).map((item) => ({
      title: item.name,
      reason: `Koszt przekracza plan o ${formatCurrency(Number(item.actual_cost) - Number(item.planned_cost))}`,
      href: `/projects/${projectId}/budget`,
      priority: "Wysoka"
    })),
    ...rooms.filter((room) => !inspirations.some((item) => item.room_id === room.id && item.selected_for_designer)).map((room) => ({
      title: room.name,
      reason: "Brak wybranych inspiracji dla projektanta",
      href: `/projects/${projectId}/inspirations`,
      priority: "Niska"
    })),
    ...differences.filter((item) => item.status === "NEEDS_DISCUSSION").map((item) => ({
      title: item.title,
      reason: "Różnica w planach wymaga omówienia",
      href: `/projects/${projectId}/plans/compare`,
      priority: "Średnia"
    })),
    ...products.filter((item) => ["ORDERED", "SHIPPED", "DELAYED"].includes(item.delivery_status)).map((item) => ({
      title: item.name,
      reason: "Produkt jest zamówiony, ale nie został oznaczony jako dostarczony",
      href: `/projects/${projectId}/products`,
      priority: item.delivery_status === "DELAYED" ? "Wysoka" : "Średnia"
    }))
  ].slice(0, 12);

  return (
    <>
      <PageHeader title="Co teraz?" description="Deterministyczna lista kolejnych działań na podstawie danych projektu. Bez AI." />
      <div className="mt-6 grid gap-3">
        {actions.length ? actions.map((action, index) => (
          <Link href={action.href} key={`${action.title}-${index}`}>
            <Card className="hover:border-primary">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{action.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{action.reason}</p>
                </div>
                <Badge tone={action.priority === "Wysoka" ? "red" : action.priority === "Średnia" ? "amber" : "gray"}>{action.priority}</Badge>
              </div>
            </Card>
          </Link>
        )) : <Card>Nie ma pilnych działań. Dane projektu nie wskazują obecnie blokad ani przekroczeń.</Card>}
      </div>
    </>
  );
}
