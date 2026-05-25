import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireProject } from "@/lib/data";
import { computeNextActions } from "@/lib/next-actions";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, ArrowRight } from "lucide-react";
import Link from "next/link";

const urgencyConfig = {
  critical: {
    icon: AlertCircle,
    badgeVariant: "red" as const,
    label: "Krytyczne",
    bg: "bg-red-50 border-red-200",
  },
  high: {
    icon: AlertTriangle,
    badgeVariant: "amber" as const,
    label: "Pilne",
    bg: "bg-amber-50 border-amber-200",
  },
  medium: {
    icon: Info,
    badgeVariant: "blue" as const,
    label: "Ważne",
    bg: "bg-blue-50 border-blue-200",
  },
  low: {
    icon: CheckCircle2,
    badgeVariant: "gray" as const,
    label: "Do zrobienia",
    bg: "bg-muted border-border",
  },
};

export default async function NextActionsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase, project } = await requireProject(projectId);

  const actions = await computeNextActions(projectId, supabase);

  const critical = actions.filter((a) => a.urgency === "critical");
  const high = actions.filter((a) => a.urgency === "high");
  const medium = actions.filter((a) => a.urgency === "medium");
  const low = actions.filter((a) => a.urgency === "low");

  return (
    <>
      <PageHeader
        title="Co teraz?"
        description={`Priorytety dla projektu: ${project.name}`}
      />

      {actions.length === 0 ? (
        <EmptyState
          title="Wszystko w porządku!"
          description="Brak pilnych zadań. Projekt idzie zgodnie z planem."
          className="mt-6"
        />
      ) : (
        <div className="mt-6 space-y-6">
          {/* Summary bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{critical.length}</p>
              <p className="text-xs text-red-500 mt-0.5">Krytyczne</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{high.length}</p>
              <p className="text-xs text-amber-500 mt-0.5">Pilne</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{medium.length}</p>
              <p className="text-xs text-blue-500 mt-0.5">Ważne</p>
            </div>
            <div className="rounded-lg border border-border bg-muted p-3 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{low.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Do zrobienia</p>
            </div>
          </div>

          {/* Action list */}
          <Card>
            <h2 className="font-semibold mb-4">Lista priorytetów</h2>
            <div className="space-y-2">
              {actions.map((action, i) => {
                const config = urgencyConfig[action.urgency];
                const Icon = config.icon;
                return (
                  <Link
                    key={i}
                    href={action.href}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-opacity hover:opacity-80 ${config.bg}`}
                  >
                    <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{action.title}</span>
                        <Badge variant="gray" className="text-xs">{action.category}</Badge>
                      </div>
                      {action.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {action.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
