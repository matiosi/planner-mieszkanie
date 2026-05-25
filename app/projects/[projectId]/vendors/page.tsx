import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DeleteButton } from "@/components/delete-button";
import { labelFor, labels, statusVariant } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { requireProject } from "@/lib/data";
import { upsertVendor, deleteVendor } from "@/app/actions/vendors";
import { upsertVendorMeeting, deleteVendorMeeting } from "@/app/actions/vendor-meetings";
import { Plus, Phone, Mail, Calendar, ChevronDown } from "lucide-react";

export default async function VendorsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: vendors }, { data: meetings }] = await Promise.all([
    supabase
      .from("vendors")
      .select("id,name,type,phone,email,offer_amount,status,notes")
      .eq("project_id", projectId)
      .order("status")
      .order("name"),
    supabase
      .from("vendor_meetings")
      .select("id,vendor_id,title,meeting_date,notes,outcome,next_steps")
      .eq("project_id", projectId)
      .order("meeting_date", { ascending: false }),
  ]);

  const list = vendors ?? [];
  const allMeetings = meetings ?? [];

  return (
    <>
      <PageHeader title="Wykonawcy" description="Śledź wykonawców, oferty i spotkania." />

      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj wykonawcę</h2>
        <form action={upsertVendor.bind(null, projectId)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Nazwa / imię i nazwisko *">
            <Input name="name" required placeholder="np. Jan Kowalski — elektryk" />
          </Field>
          <Field label="Rodzaj">
            <Select name="type" defaultValue="OTHER">
              {Object.entries(labels.vendorType).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="CONTACTED">
              {Object.entries(labels.vendorStatus).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Kwota oferty (PLN)">
            <Input name="offer_amount" type="number" step="500" placeholder="np. 15000" />
          </Field>
          <Field label="Telefon">
            <Input name="phone" type="tel" placeholder="+48 600 000 000" />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" placeholder="jan@example.com" />
          </Field>
          <Field label="Notatki" className="sm:col-span-2">
            <Input name="notes" placeholder="Uwagi, rekomendacje…" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Dodaj wykonawcę
            </Button>
          </div>
        </form>
      </Card>

      {!list.length ? (
        <EmptyState title="Brak wykonawców" description="Dodaj pierwszego wykonawcę powyżej." className="mt-6" />
      ) : (
        <div className="mt-6 space-y-4">
          {list.map((v) => {
            const vendorMeetings = allMeetings.filter((m) => m.vendor_id === v.id);
            return (
              <Card key={v.id}>
                {/* Dane wykonawcy */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold">{v.name}</p>
                    <p className="text-xs text-muted-foreground">{labelFor(labels.vendorType, v.type)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(v.status)}>{labelFor(labels.vendorStatus, v.status)}</Badge>
                    <DeleteButton
                      action={deleteVendor.bind(null, projectId)}
                      id={v.id}
                      confirmMessage={`Usuń wykonawcę "${v.name}"?`}
                      size="sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                  {v.offer_amount && (
                    <span className="font-semibold text-foreground">{formatCurrency(v.offer_amount)}</span>
                  )}
                  {v.phone && (
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{v.phone}</span>
                  )}
                  {v.email && (
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{v.email}</span>
                  )}
                </div>
                {v.notes && (
                  <p className="text-xs text-muted-foreground mb-3">{v.notes}</p>
                )}

                {/* Spotkania */}
                <details className="border-t border-border pt-3">
                  <summary className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none list-none hover:text-foreground transition-colors">
                    <Calendar className="h-3.5 w-3.5" />
                    Spotkania ({vendorMeetings.length})
                    <ChevronDown className="h-3.5 w-3.5 ml-auto" />
                  </summary>

                  <div className="mt-3 space-y-2">
                    {vendorMeetings.map((m) => (
                      <div key={m.id} className="rounded-md border border-border bg-muted/30 px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{m.title}</p>
                            {m.meeting_date && (
                              <p className="text-xs text-muted-foreground">
                                <Calendar className="inline h-3 w-3 mr-1" />
                                {formatDate(m.meeting_date)}
                              </p>
                            )}
                            {m.notes && <p className="text-xs text-muted-foreground mt-1">{m.notes}</p>}
                            {m.outcome && (
                              <p className="text-xs mt-1"><span className="font-medium">Wynik:</span> {m.outcome}</p>
                            )}
                            {m.next_steps && (
                              <p className="text-xs mt-0.5"><span className="font-medium">Następne kroki:</span> {m.next_steps}</p>
                            )}
                          </div>
                          <DeleteButton
                            action={deleteVendorMeeting.bind(null, projectId)}
                            id={m.id}
                            confirmMessage="Usuń to spotkanie?"
                            size="sm"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Formularz nowego spotkania */}
                    <form action={upsertVendorMeeting.bind(null, projectId)} className="mt-3 grid gap-2 sm:grid-cols-2">
                      <input type="hidden" name="vendor_id" value={v.id} />
                      <Field label="Tytuł spotkania *">
                        <Input name="title" required placeholder="np. Ustalenie zakresu prac" />
                      </Field>
                      <Field label="Data">
                        <Input name="meeting_date" type="datetime-local" />
                      </Field>
                      <Field label="Notatki" className="sm:col-span-2">
                        <Textarea name="notes" rows={2} placeholder="Co ustalono?" />
                      </Field>
                      <Field label="Wynik / rezultat">
                        <Input name="outcome" placeholder="np. Złożona oferta" />
                      </Field>
                      <Field label="Następne kroki">
                        <Input name="next_steps" placeholder="np. Podpisanie umowy do piątku" />
                      </Field>
                      <div className="sm:col-span-2">
                        <Button type="submit" variant="secondary" size="sm">
                          <Plus className="h-3.5 w-3.5" /> Dodaj spotkanie
                        </Button>
                      </div>
                    </form>
                  </div>
                </details>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
