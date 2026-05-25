import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DeleteButton } from "@/components/delete-button";
import { labelFor, labels, statusVariant } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { requireProject } from "@/lib/data";
import { upsertProduct, deleteProduct } from "@/app/actions/products";
import { Plus, ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: products }, { data: rooms }] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,category,price,url,store,status,delivery_status,expected_delivery_date,room_id,purchase_priority")
      .eq("project_id", projectId)
      .order("status")
      .order("name"),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
  ]);

  const list = products ?? [];
  const roomList = rooms ?? [];

  async function addProduct(formData: FormData) {
    "use server";
    await upsertProduct(projectId, formData);
  }

  return (
    <>
      <PageHeader
        title="Produkty"
        description={`${list.length} produktów w projekcie`}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={`/projects/${projectId}/shopping-list`}>Lista zakupów</Link>
          </Button>
        }
      />

      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj produkt</h2>
        <form action={addProduct} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Nazwa *" className="sm:col-span-2">
            <Input name="name" required placeholder="np. Płytki Tubądzin Stone Flower 60×60" />
          </Field>
          <Field label="Kategoria">
            <Input name="category" placeholder="np. Płytki" />
          </Field>
          <Field label="Sklep">
            <Input name="store" placeholder="np. Castorama" />
          </Field>
          <Field label="Cena (PLN)">
            <Input name="price" type="number" step="0.01" placeholder="0.00" />
          </Field>
          <Field label="Link">
            <Input name="url" type="url" placeholder="https://…" />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="FOUND">
              {Object.entries(labels.productStatus).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Priorytet">
            <Select name="purchase_priority" defaultValue="MEDIUM">
              {Object.entries(labels.priority).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Pomieszczenie">
            <Select name="room_id" defaultValue="">
              <option value="">— brak —</option>
              {roomList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="Oczekiwana dostawa">
            <Input name="expected_delivery_date" type="date" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Dodaj produkt
            </Button>
          </div>
        </form>
      </Card>

      {!list.length ? (
        <EmptyState title="Brak produktów" description="Dodaj pierwszy produkt powyżej." className="mt-6" />
      ) : (
        <Card className="mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Produkt</th>
                  <th className="pb-2 pr-4 font-medium">Cena</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Dostawa</th>
                  <th className="pb-2 pr-4 font-medium">Pomieszczenie</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const roomName = roomList.find((r) => r.id === p.room_id)?.name;
                  return (
                    <tr key={p.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-4">
                        <div>
                          <p className="font-medium">{p.name}</p>
                          {p.category && <p className="text-xs text-muted-foreground">{p.category}</p>}
                          {p.url && (
                            <a href={p.url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" /> {p.store || "Link"}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-4">{formatCurrency(p.price)}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={statusVariant(p.status)}>
                          {labelFor(labels.productStatus, p.status)}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">
                        <div>
                          <Badge variant={statusVariant(p.delivery_status)}>
                            {labelFor(labels.deliveryStatus, p.delivery_status)}
                          </Badge>
                          {p.expected_delivery_date && (
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(p.expected_delivery_date)}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{roomName ?? "—"}</td>
                      <td className="py-2">
                        <DeleteButton
                          action={deleteProduct.bind(null, projectId)}
                          id={p.id}
                          confirmMessage={`Usuń produkt "${p.name}"?`}
                          size="sm"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
