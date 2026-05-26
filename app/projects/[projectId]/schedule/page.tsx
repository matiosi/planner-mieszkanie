import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/delete-button";
import { ScheduleGantt } from "@/components/schedule-gantt";
import { labelFor, labels, statusVariant } from "@/lib/labels";
import { formatDate } from "@/lib/formatters";
import { requireProject } from "@/lib/data";
import { upsertScheduleItem, deleteScheduleItem } from "@/app/actions/schedule";
import { Plus, Calendar, LayoutList, GanttChartSquare } from "lucide-react";
import Link from "next/link";

export default async function SchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { projectId } = await params;
  const { view } = await searchParams;
  const isGantt = view === "gantt";
  const { supabase } = await requireProject(projectId);

  const [{ data: items }, { data: rooms }, { data: vendors }] = await Promise.all([
    supabase
      .from("schedule_items")
      .select("id,title,description,start_date,end_date,status,room_id,vendor_id,notes")
      .eq("project_id", projectId)
      .order("start_date", { ascending: true, nullsFirst: false }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
    supabase.from("vendors").select("id,name").eq("project_id", projectId).order("name"),
  ]);

  const list = items ?? [];
  const roomList = rooms ?? [];
  const vendorList = vendors ?? [];

  async function addItem(formData: FormData) {
    "use server";
    await upsertScheduleItem(projectId, formData);
  }

  const statusGroups = [
    { key: "IN_PROGRESS", label: "W trakcie" },
    { key: "PLANNED", label: "Planowane" },
    { key: "DELAYED", label: "Opóźnione" },
    { key: "DONE", label: "Ukończone" },
    { key: "CANCELLED", label: "Anulowane" },
  ] as const;

  return (
    <>
      <PageHeader
        title="Harmonogram"
        description={`${list.length} etapów`}
        actions={
          <div className="flex gap-1 rounded-md border border-border p-0.5">
            <Button asChild size="sm" variant={isGantt ? "ghost" : "secondary"}>
              <Link href={`/projects/${projectId}/schedule`}>
                <LayoutList className="h-4 w-4" /> Lista
              </Link>
            </Button>
            <Button asChild size="sm" variant={isGantt ? "secondary" : "ghost"}>
              <Link href={`/projects/${projectId}/schedule?view=gantt`}>
                <GanttChartSquare className="h-4 w-4" /> Gantt
              </Link>
            </Button>
          </div>
        }
      />

      {/* Add form */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj etap</h2>
        <form action={addItem} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Tytuł *" className="sm:col-span-2">
            <Input name="title" required placeholder="np. Prace instalacyjne elektryczne" />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="PLANNED">
              {Object.entries(labels.scheduleStatus).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Data rozpoczęcia">
            <Input name="start_date" type="date" />
          </Field>
          <Field label="Data zakończenia">
            <Input name="end_date" type="date" />
          </Field>
          <Field label="Pomieszczenie">
            <Select name="room_id" defaultValue="">
              <option value="">— wszystkie —</option>
              {roomList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="Wykonawca">
            <Select name="vendor_id" defaultValue="">
              <option value="">— brak —</option>
              {vendorList.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          </Field>
          <Field label="Opis" className="sm:col-span-2">
            <Textarea name="description" rows={2} placeholder="Opis etapu…" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Dodaj etap
            </Button>
          </div>
        </form>
      </Card>

      {/* Gantt / Lista */}
      {!list.length ? (
        <EmptyState title="Brak etapów harmonogramu" description="Dodaj pierwszy etap powyżej." className="mt-6" />
      ) : isGantt ? (
        <ScheduleGantt items={list} roomList={roomList} />
      ) : (
        <div className="mt-6 space-y-6">
          {statusGroups.map(({ key, label }) => {
            const groupItems = list.filter((i) => i.status === key);
            if (!groupItems.length) return null;
            return (
              <div key={key}>
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge variant={statusVariant(key)}>{label}</Badge>
                  <span className="text-sm text-muted-foreground">({groupItems.length})</span>
                </h2>
                <div className="space-y-3">
                  {groupItems.map((item) => {
                    const roomName = roomList.find((r) => r.id === item.room_id)?.name;
                    const vendorName = vendorList.find((v) => v.id === item.vendor_id)?.name;
                    return (
                      <Card key={item.id} className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.start_date && (
                              <span className="text-xs text-muted-foreground">
                                {formatDate(item.start_date)}
                                {item.end_date && ` → ${formatDate(item.end_date)}`}
                              </span>
                            )}
                            {roomName && <Badge variant="gray">{roomName}</Badge>}
                            {vendorName && <Badge variant="gray">{vendorName}</Badge>}
                          </div>
                          <div className="mt-2">
                            <DeleteButton
                              action={deleteScheduleItem.bind(null, projectId)}
                              id={item.id}
                              confirmMessage={`Usuń etap "${item.title}"?`}
                              size="sm"
                            />
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
