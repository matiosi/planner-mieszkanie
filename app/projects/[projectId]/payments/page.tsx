import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/delete-button";
import { labelFor, labels, statusVariant } from "@/lib/labels";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { requireProject } from "@/lib/data";
import { upsertPayment, deletePayment } from "@/app/actions/payments";
import { Plus } from "lucide-react";

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: payments }, { data: vendors }] = await Promise.all([
    supabase
      .from("payments")
      .select("id,title,amount,status,planned_date,paid_date,vendor_id,payment_method,notes")
      .eq("project_id", projectId)
      .order("planned_date", { ascending: true, nullsFirst: false }),
    supabase.from("vendors").select("id,name").eq("project_id", projectId).order("name"),
  ]);

  const list = payments ?? [];
  const vendorList = vendors ?? [];

  const totalPlanned = list.filter((p) => p.status !== "CANCELLED").reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalPaid = list.filter((p) => p.status === "PAID").reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalDue = list.filter((p) => ["DUE", "OVERDUE"].includes(p.status)).reduce((s, p) => s + (p.amount ?? 0), 0);

  async function addPayment(formData: FormData) {
    "use server";
    await upsertPayment(projectId, formData);
  }

  const statusGroups = [
    { key: "OVERDUE", label: "Po terminie" },
    { key: "DUE", label: "Do zapłaty" },
    { key: "PLANNED", label: "Planowane" },
    { key: "PAID", label: "Zapłacone" },
    { key: "CANCELLED", label: "Anulowane" },
  ] as const;

  return (
    <>
      <PageHeader
        title="Płatności"
        description={`${list.length} płatności`}
      />

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-muted-foreground">Łącznie do zapłaty</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalDue)}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Zapłacono</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(totalPaid)}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Planowane łącznie</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalPlanned)}</p>
        </Card>
      </div>

      {/* Add form */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj płatność</h2>
        <form action={addPayment} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Tytuł *" className="sm:col-span-2">
            <Input name="title" required placeholder="np. Zaliczka dla wykonawcy" />
          </Field>
          <Field label="Kwota *">
            <Input name="amount" type="number" step="0.01" required placeholder="0.00" />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="PLANNED">
              {Object.entries(labels.paymentStatus).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Planowana data">
            <Input name="planned_date" type="date" />
          </Field>
          <Field label="Data zapłaty">
            <Input name="paid_date" type="date" />
          </Field>
          <Field label="Wykonawca">
            <Select name="vendor_id" defaultValue="">
              <option value="">— brak —</option>
              {vendorList.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          </Field>
          <Field label="Metoda płatności">
            <Input name="payment_method" placeholder="np. przelew, gotówka" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Dodaj płatność
            </Button>
          </div>
        </form>
      </Card>

      {/* Payments list */}
      {!list.length ? (
        <EmptyState title="Brak płatności" description="Dodaj pierwszą płatność powyżej." className="mt-6" />
      ) : (
        <div className="mt-6 space-y-6">
          {statusGroups.map(({ key, label }) => {
            const groupItems = list.filter((p) => p.status === key);
            if (!groupItems.length) return null;
            return (
              <div key={key}>
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge variant={statusVariant(key)}>{label}</Badge>
                  <span className="text-sm text-muted-foreground">
                    ({formatCurrency(groupItems.reduce((s, p) => s + (p.amount ?? 0), 0))})
                  </span>
                </h2>
                <div className="space-y-2">
                  {groupItems.map((payment) => {
                    const vendorName = vendorList.find((v) => v.id === payment.vendor_id)?.name;
                    return (
                      <div key={payment.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm">{payment.title}</p>
                            <span className="font-semibold text-sm shrink-0">{formatCurrency(payment.amount ?? 0)}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {vendorName && <Badge variant="gray">{vendorName}</Badge>}
                            {payment.planned_date && (
                              <span className="text-xs text-muted-foreground">Plan: {formatDate(payment.planned_date)}</span>
                            )}
                            {payment.paid_date && (
                              <span className="text-xs text-green-600">Zapłacono: {formatDate(payment.paid_date)}</span>
                            )}
                            {payment.payment_method && (
                              <Badge variant="gray">{payment.payment_method}</Badge>
                            )}
                          </div>
                        </div>
                        <DeleteButton
                          action={deletePayment.bind(null, projectId)}
                          id={payment.id}
                          confirmMessage={`Usuń płatność "${payment.title}"?`}
                          size="sm"
                        />
                      </div>
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
