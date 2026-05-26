import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireProject } from "@/lib/data";
import { formatDate, formatDistanceToNow } from "@/lib/formatters";
import {
  CheckSquare, Lightbulb, ShoppingBag, CreditCard, Users,
  FileText, Wrench, AlertOctagon, Clock,
} from "lucide-react";

const ENTITY_ICONS: Record<string, React.ElementType> = {
  task: CheckSquare,
  decision: Lightbulb,
  product: ShoppingBag,
  payment: CreditCard,
  vendor: Users,
  document: FileText,
  vendor_meeting: Wrench,
  constraint: AlertOctagon,
};

const ACTION_VARIANTS: Record<string, "green" | "red" | "gray" | "blue"> = {
  created: "green",
  deleted: "red",
  updated: "gray",
  status_changed: "blue",
};

const ACTION_LABELS: Record<string, string> = {
  created: "Dodano",
  deleted: "Usunięto",
  updated: "Edytowano",
  status_changed: "Zmieniono status",
};

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const { data: entries } = await supabase
    .from("activity_log")
    .select("id,entity_type,entity_id,action,description,created_at,user_id")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(100);

  const list = entries ?? [];

  // Grupuj po dniu
  const byDay = list.reduce<Record<string, typeof list>>((acc, e) => {
    const day = e.created_at.slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(e);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Historia zmian"
        description={`${list.length} ostatnich wpisów`}
      />

      {!list.length ? (
        <EmptyState
          title="Brak historii"
          description="Historia zapisuje się automatycznie gdy dodajesz lub edytujesz zadania, decyzje i produkty."
          className="mt-6"
        />
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(byDay).map(([day, dayEntries]) => (
            <div key={day}>
              <p className="text-sm font-semibold text-muted-foreground mb-2">{formatDate(day)}</p>
              <Card className="divide-y divide-border p-0 overflow-hidden">
                {dayEntries.map((entry) => {
                  const Icon = ENTITY_ICONS[entry.entity_type] ?? Clock;
                  const variant = ACTION_VARIANTS[entry.action] ?? "gray";
                  const actionLabel = ACTION_LABELS[entry.action] ?? entry.action;
                  return (
                    <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="mt-0.5 rounded-md bg-muted p-1.5 shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{entry.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={variant}>{actionLabel}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(entry.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
