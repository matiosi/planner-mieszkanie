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
import { labelFor, labels, statusVariant } from "@/lib/labels";
import { formatDate } from "@/lib/formatters";
import { requireProject } from "@/lib/data";
import { upsertPunchListItem, deletePunchListItem } from "@/app/actions/punch-list";
import { Plus, Download } from "lucide-react";
import Link from "next/link";

export default async function PunchListPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ room?: string; vendor?: string; status?: string; severity?: string }>;
}) {
  const { projectId } = await params;
  const filters = await searchParams;
  const { supabase } = await requireProject(projectId);

  const [{ data: items }, { data: rooms }, { data: vendors }] = await Promise.all([
    supabase
      .from("punch_list_items")
      .select("id,title,description,severity,status,room_id,vendor_id,due_date,notes,resolved_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
    supabase.from("vendors").select("id,name").eq("project_id", projectId).order("name"),
  ]);

  const list = items ?? [];
  const roomList = rooms ?? [];
  const vendorList = vendors ?? [];
  const filtered = list.filter((item) => {
    if (filters.room && item.room_id !== filters.room) return false;
    if (filters.vendor && item.vendor_id !== filters.vendor) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.severity && item.severity !== filters.severity) return false;
    return true;
  });

  const open = filtered.filter((i) => !["FIXED", "ACCEPTED"].includes(i.status));
  const closed = filtered.filter((i) => ["FIXED", "ACCEPTED"].includes(i.status));

  async function addItem(formData: FormData) {
    "use server";
    await upsertPunchListItem(projectId, formData);
  }

  return (
    <>
      <PageHeader
        title="Lista usterek"
        description={`${open.length} otwartych, ${closed.length} zamkniętych`}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={`/api/projects/${projectId}/export/punch-list`}>
              <Download className="h-4 w-4" /> Protokół PDF
            </Link>
          </Button>
        }
      />

      {/* Add form */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Zgłoś usterkę</h2>
        <form action={addItem} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Tytuł *" className="sm:col-span-2">
            <Input name="title" required placeholder="np. Pęknięcie płytki w łazience" />
          </Field>
          <Field label="Waga">
            <Select name="severity" defaultValue="MEDIUM">
              {Object.entries(labels.punchListSeverity).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="NEW">
              {Object.entries(labels.punchListStatus).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Faza odbioru">
            <Select name="acceptance_phase" defaultValue="FINAL">
              <option value="PRE">Przed odbiorem</option>
              <option value="FINAL">Odbiór końcowy</option>
              <option value="WARRANTY">Gwarancyjnie</option>
            </Select>
          </Field>
          <Field label="Pomieszczenie">
            <Select name="room_id" defaultValue="">
              <option value="">— brak —</option>
              {roomList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="Wykonawca odpowiedzialny">
            <Select name="vendor_id" defaultValue="">
              <option value="">— brak —</option>
              {vendorList.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          </Field>
          <Field label="Termin naprawy">
            <Input name="due_date" type="date" />
          </Field>
          <Field label="Zdjęcie usterki">
            <Input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
          </Field>
          <Field label="Opis" className="sm:col-span-2 lg:col-span-3">
            <Textarea name="description" rows={2} placeholder="Szczegóły usterki…" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Zgłoś usterkę
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mt-4">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Pomieszczenie">
            <Select name="room" defaultValue={filters.room ?? ""}>
              <option value="">Wszystkie</option>
              {roomList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="Wykonawca">
            <Select name="vendor" defaultValue={filters.vendor ?? ""}>
              <option value="">Wszyscy</option>
              {vendorList.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={filters.status ?? ""}>
              <option value="">Wszystkie</option>
              {Object.entries(labels.punchListStatus).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Waga">
            <Select name="severity" defaultValue={filters.severity ?? ""}>
              <option value="">Wszystkie</option>
              {Object.entries(labels.punchListSeverity).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button type="submit" variant="secondary" size="sm">Filtruj</Button>
          </div>
        </form>
      </Card>

      {/* Open items */}
      {!open.length && !closed.length ? (
        <EmptyState title="Brak usterek" description="Zgłoś pierwszą usterkę powyżej." className="mt-6" />
      ) : (
        <div className="mt-6 space-y-6">
          {open.length > 0 && (
            <div>
              <h2 className="font-semibold mb-3">Otwarte ({open.length})</h2>
              <div className="space-y-3">
                {open.map((item) => {
                  const roomName = roomList.find((r) => r.id === item.room_id)?.name;
                  const vendorName = vendorList.find((v) => v.id === item.vendor_id)?.name;
                  return (
                    <Card key={item.id}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{item.title}</p>
                        <div className="flex gap-1 shrink-0">
                          <Badge variant={statusVariant(item.severity)}>
                            {labelFor(labels.punchListSeverity, item.severity)}
                          </Badge>
                          <Badge variant={statusVariant(item.status)}>
                            {labelFor(labels.punchListStatus, item.status)}
                          </Badge>
                        </div>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {roomName && <Badge variant="gray">{roomName}</Badge>}
                        {vendorName && <Badge variant="gray">{vendorName}</Badge>}
                        {item.due_date && (
                          <span className="text-xs text-muted-foreground">Termin: {formatDate(item.due_date)}</span>
                        )}
                      </div>
                      <div className="mt-2">
                        <DeleteButton
                          action={deletePunchListItem.bind(null, projectId)}
                          id={item.id}
                          confirmMessage={`Usuń usterkę "${item.title}"?`}
                          size="sm"
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {closed.length > 0 && (
            <div>
              <h2 className="font-semibold mb-3 text-muted-foreground">Zamknięte ({closed.length})</h2>
              <div className="space-y-2">
                {closed.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-md border border-border p-3 opacity-60">
                    <div className="flex-1">
                      <p className="font-medium text-sm line-through">{item.title}</p>
                      <Badge variant="green" className="mt-1">{labelFor(labels.punchListStatus, item.status)}</Badge>
                    </div>
                    <DeleteButton
                      action={deletePunchListItem.bind(null, projectId)}
                      id={item.id}
                      confirmMessage={`Usuń usterkę "${item.title}"?`}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
