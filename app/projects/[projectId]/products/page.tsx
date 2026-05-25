import { deleteRow, upsertProduct } from "@/app/actions";
import { Badge, Button, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { labelFor, labels } from "@/lib/labels";
import { requireProject } from "@/lib/data";

export default async function ProductsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);
  const [products, rooms] = await Promise.all([
    supabase.from("products").select("*, rooms(name)").eq("project_id", projectId).order("created_at"),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("name")
  ]);

  return (
    <>
      <PageHeader title="Produkty" description="Produkty, sklepy, ceny, status zakupów i dostawy." />
      <Card className="mt-6">
        <form action={upsertProduct.bind(null, projectId)} className="grid gap-3 md:grid-cols-8">
          <Field label="Nazwa"><input className={inputClass} name="name" required /></Field>
          <Field label="Kategoria"><input className={inputClass} name="category" /></Field>
          <Field label="Cena"><input className={inputClass} name="price" type="number" /></Field>
          <Field label="Sklep"><input className={inputClass} name="store" /></Field>
          <Field label="Pokój"><select className={inputClass} name="room_id"><option value="">Cały projekt</option>{rooms.data?.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></Field>
          <Field label="Status"><select className={inputClass} name="status">{Object.entries(labels.productStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="Dostawa"><select className={inputClass} name="delivery_status">{Object.entries(labels.deliveryStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <div className="flex items-end"><Button className="w-full">Dodaj</Button></div>
          <Field label="URL"><input className={inputClass} name="url" /></Field>
          <Field label="Zdjęcie URL"><input className={inputClass} name="image_url" /></Field>
          <Field label="Termin dostawy"><input className={inputClass} name="expected_delivery_date" type="date" /></Field>
          <Field label="Notatki"><input className={inputClass} name="notes" /></Field>
        </form>
      </Card>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.data?.map((product) => (
          <Card key={product.id}>
            {product.image_url ? <img src={product.image_url} alt="" className="mb-4 aspect-video w-full rounded-md object-cover" /> : null}
            <h2 className="font-semibold">{product.url ? <a href={product.url} target="_blank">{product.name}</a> : product.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{product.store || "Brak sklepu"} · {product.rooms?.name ?? "Cały projekt"}</p>
            <div className="mt-4 flex flex-wrap gap-2"><Badge>{labelFor(labels.productStatus, product.status)}</Badge><Badge>{labelFor(labels.deliveryStatus, product.delivery_status)}</Badge></div>
            <p className="mt-3 text-sm">Cena: {formatCurrency(product.price)}</p>
            <p className="text-sm">Dostawa: {formatDate(product.expected_delivery_date)}</p>
            <form action={deleteRow.bind(null, projectId, "products", "/products")} className="mt-4"><input type="hidden" name="id" value={product.id} /><Button variant="danger">Usuń</Button></form>
          </Card>
        ))}
      </div>
    </>
  );
}
