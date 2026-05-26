import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/delete-button";
import { requireUser } from "@/lib/data";
import { formatCurrency } from "@/lib/formatters";
import { upsertLibraryProduct, addLibraryProductToProject } from "@/app/actions/library";
import { ExternalLink, Plus, FolderPlus } from "lucide-react";

export default async function LibraryProductsPage() {
  const { supabase, user } = await requireUser();

  const [{ data: products }, { data: projects }] = await Promise.all([
    supabase
      .from("user_product_library")
      .select("id,name,category,url,price,store,notes,image_url")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("projects")
      .select("id,name")
      .order("created_at", { ascending: false }),
  ]);

  const list = products ?? [];
  const projectList = projects ?? [];

  return (
    <>
      <PageHeader
        title="Biblioteka produktów"
        description={`${list.length} produktów`}
      />

      {/* Formularz dodawania */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj produkt do biblioteki</h2>
        <form action={upsertLibraryProduct} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Nazwa *" className="sm:col-span-2">
            <Input name="name" required placeholder="np. Płytki Tubądzin Stone 60×60" />
          </Field>
          <Field label="Kategoria">
            <Input name="category" placeholder="np. Płytki, Oświetlenie" />
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
          <Field label="Link do zdjęcia">
            <Input name="image_url" type="url" placeholder="https://…" />
          </Field>
          <Field label="Notatki">
            <Input name="notes" placeholder="Wymiary, kolor, uwagi…" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Dodaj do biblioteki
            </Button>
          </div>
        </form>
      </Card>

      {/* Lista produktów */}
      {!list.length ? (
        <EmptyState
          title="Brak produktów"
          description="Zapisuj produkty które lubisz lub planujesz kupić."
          className="mt-6"
        />
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((product) => (
            <Card key={product.id} className="flex flex-col gap-2 p-0 overflow-hidden">
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-36 w-full object-cover"
                />
              )}
              <div className="p-3 flex flex-col gap-2 flex-1">
                <div>
                  <p className="font-semibold leading-snug">{product.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.category && <Badge variant="gray">{product.category}</Badge>}
                    {product.store && <Badge variant="blue">{product.store}</Badge>}
                  </div>
                </div>
                {product.price && (
                  <p className="text-sm font-medium text-primary">{formatCurrency(product.price)}</p>
                )}
                {product.notes && (
                  <p className="text-xs text-muted-foreground">{product.notes}</p>
                )}

                {/* Dodaj do projektu */}
                {projectList.length > 0 && (
                  <form action={addLibraryProductToProject} className="flex gap-2 pt-1">
                    <input type="hidden" name="library_id" value={product.id} />
                    <Select name="project_id" defaultValue="" className="flex-1 text-xs h-8">
                      <option value="">Wybierz projekt…</option>
                      {projectList.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </Select>
                    <Button type="submit" size="sm" variant="secondary" className="shrink-0">
                      <FolderPlus className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                )}

                <div className="flex items-center gap-2 mt-auto pt-1">
                  {product.url && (
                    <a href={product.url} target="_blank" rel="noopener noreferrer">
                      <Button type="button" variant="ghost" size="sm">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                  <DeleteButton
                    action={deleteProductAction.bind(null, product.id)}
                    id={product.id}
                    confirmMessage={`Usuń "${product.name}" z biblioteki?`}
                    size="sm"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

async function deleteProductAction(id: string, formData: FormData) {
  "use server";
  formData.set("id", id);
  const { deleteLibraryProduct } = await import("@/app/actions/library");
  await deleteLibraryProduct(formData);
}
