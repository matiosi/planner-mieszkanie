import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireProjectAccess } from "@/lib/data";
import { computeNextActions } from "@/lib/next-actions";
import { formatDate } from "@/lib/formatters";
import {
  ignoreNotification,
  markAllNotificationsRead,
  markNotificationRead,
  restoreNotification,
} from "@/app/actions/notifications";
import { Bell, CheckCircle2, EyeOff, RotateCcw } from "lucide-react";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase, user } = await requireProjectAccess(projectId);
  const [actions, { data: notifications }] = await Promise.all([
    computeNextActions(projectId, supabase),
    supabase
      .from("notifications")
      .select("id,title,body,type,entity_type,entity_id,read,ignored_at,created_at")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const activeNotifications = (notifications ?? []).filter((item) => !item.ignored_at);
  const ignoredNotifications = (notifications ?? []).filter((item) => item.ignored_at);
  const unread = activeNotifications.filter((item) => !item.read);

  return (
    <>
      <PageHeader
        title="Powiadomienia"
        description="Alerty z projektu i automatycznie wyliczone ryzyka."
        actions={
          <form action={markAllNotificationsRead.bind(null, projectId)}>
            <Button type="submit" variant="secondary" size="sm" disabled={!unread.length}>
              <CheckCircle2 className="h-4 w-4" /> Oznacz wszystko
            </Button>
          </form>
        }
      />

      <Card className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Wymaga uwagi</h2>
        </div>
        {actions.length ? (
          <div className="grid gap-2">
            {actions.map((action) => (
              <Link key={`${action.category}-${action.title}`} href={action.href} className="rounded-md border border-border p-3 transition-colors hover:bg-muted">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <Badge variant={action.urgency === "critical" ? "red" : action.urgency === "high" ? "amber" : "gray"}>
                    {action.category}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Brak pilnych alertów.</p>
        )}
      </Card>

      <div className="mt-6 grid gap-3">
        {activeNotifications.map((item) => (
          <Card key={item.id} className={item.read ? "opacity-70" : ""}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{item.title}</p>
                  {!item.read && <Badge variant="blue">Nowe</Badge>}
                </div>
                {item.body && <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>}
                <p className="mt-2 text-xs text-muted-foreground">{formatDate(item.created_at.slice(0, 10))}</p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                {!item.read && (
                  <form action={markNotificationRead.bind(null, projectId)}>
                    <input type="hidden" name="id" value={item.id} />
                    <Button type="submit" variant="ghost" size="sm">Przeczytane</Button>
                  </form>
                )}
                <form action={ignoreNotification.bind(null, projectId)}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    <EyeOff className="h-4 w-4" /> Ignoruj
                  </Button>
                </form>
              </div>
            </div>
          </Card>
        ))}
        {!activeNotifications.length && (
          <p className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Brak zapisanych powiadomień.
          </p>
        )}
      </div>

      {!!ignoredNotifications.length && (
        <Card className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Ignorowane</h2>
          </div>
          <div className="grid gap-2">
            {ignoredNotifications.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3 opacity-70">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.body && <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Zignorowano: {item.ignored_at ? formatDate(item.ignored_at.slice(0, 10)) : "brak daty"}
                  </p>
                </div>
                <form action={restoreNotification.bind(null, projectId)}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button type="submit" variant="secondary" size="sm">
                    <RotateCcw className="h-4 w-4" /> Przywróć
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
