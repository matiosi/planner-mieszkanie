import { deleteRow, upsertVendor } from "@/app/actions";
import { Badge, Button, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { labelFor, labels } from "@/lib/labels";
import { requireProject } from "@/lib/data";

export default async function VendorsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);
  const { data: vendors } = await supabase.from("vendors").select("*").eq("project_id", projectId).order("created_at");

  return (
    <>
      <PageHeader title="Wykonawcy" description="Kontakty, oferty i status rozmów z wykonawcami." />
      <Card className="mt-6">
        <form action={upsertVendor.bind(null, projectId)} className="grid gap-3 md:grid-cols-7">
          <Field label="Nazwa"><input className={inputClass} name="name" required /></Field>
          <Field label="Typ"><select className={inputClass} name="type">{Object.entries(labels.vendorType).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="Telefon"><input className={inputClass} name="phone" /></Field>
          <Field label="E-mail"><input className={inputClass} name="email" type="email" /></Field>
          <Field label="Oferta"><input className={inputClass} name="offer_amount" type="number" /></Field>
          <Field label="Status"><select className={inputClass} name="status">{Object.entries(labels.vendorStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <div className="flex items-end"><Button className="w-full">Dodaj</Button></div>
        </form>
      </Card>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {vendors?.map((vendor) => (
          <Card key={vendor.id}>
            <h2 className="font-semibold">{vendor.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{labelFor(labels.vendorType, vendor.type)}</p>
            <div className="mt-4 flex flex-wrap gap-2"><Badge>{labelFor(labels.vendorStatus, vendor.status)}</Badge><Badge>{formatCurrency(vendor.offer_amount)}</Badge></div>
            <p className="mt-3 text-sm">{vendor.phone || "Brak telefonu"}</p>
            <p className="text-sm">{vendor.email || "Brak e-maila"}</p>
            <form action={deleteRow.bind(null, projectId, "vendors", "/vendors")} className="mt-4"><input type="hidden" name="id" value={vendor.id} /><Button variant="danger">Usuń</Button></form>
          </Card>
        ))}
      </div>
    </>
  );
}
