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
import { formatCurrency } from "@/lib/formatters";
import { requireProject } from "@/lib/data";
import { upsertVendor, deleteVendor } from "@/app/actions/vendors";
import { Plus, Phone, Mail } from "lucide-react";

export default async function VendorsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const { data: vendors } = await supabase
    .from("vendors")
    .select("id,name,type,phone,email,offer_amount,status,notes")
    .eq("project_id", projectId)
    .order("status")
    .order("name");

  const list = vendors ?? [];

  async function addVendor(formData: FormData) {
    "use server";
    await upsertVendor(projectId, formData);
  }

  return (
    <>
      <PageHeader title="Wykonawcy" description="Śledź wykonawców i ich oferty." />

      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj wykonawcę</h2>
        <form action={addVendor} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => (
            <Card key={v.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{labelFor(labels.vendorType, v.type)}</p>
                </div>
                <Badge variant={statusVariant(v.status)}>{labelFor(labels.vendorStatus, v.status)}</Badge>
              </div>
              {v.offer_amount && (
                <p className="text-lg font-semibold">{formatCurrency(v.offer_amount)}</p>
              )}
              <div className="space-y-1 text-sm text-muted-foreground">
                {v.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-3 w-3" /> {v.phone}
                  </p>
                )}
                {v.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-3 w-3" /> {v.email}
                  </p>
                )}
              </div>
              {v.notes && <p className="text-xs text-muted-foreground border-t border-border pt-2">{v.notes}</p>}
              <div className="flex gap-2 pt-2 border-t border-border">
                <DeleteButton
                  action={deleteVendor.bind(null, projectId)}
                  id={v.id}
                  confirmMessage={`Usuń wykonawcę "${v.name}"?`}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
