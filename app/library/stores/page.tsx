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
import { upsertStore } from "@/app/actions/library";
import { ExternalLink, Star, Plus } from "lucide-react";

const STORE_CATEGORIES = [
  "Budowlany", "Elektryczny", "Sanitarny", "Oświetlenie", "Meble",
  "AGD", "Podłogi", "Płytki", "Farby", "Dekoracje", "Różne",
];

export default async function StoresPage() {
  const { supabase, user } = await requireUser();

  const { data: stores } = await supabase
    .from("stores")
    .select("id,name,url,category,notes,rating")
    .eq("user_id", user.id)
    .order("name");

  const list = stores ?? [];

  return (
    <>
      <PageHeader
        title="Moje sklepy"
        description={`${list.length} sklepów w bibliotece`}
      />

      {/* Formularz dodawania */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj sklep</h2>
        <form action={upsertStore} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Nazwa *">
            <Input name="name" required placeholder="np. Castorama, IKEA" />
          </Field>
          <Field label="Strona WWW">
            <Input name="url" type="url" placeholder="https://…" />
          </Field>
          <Field label="Kategoria">
            <Select name="category" defaultValue="">
              <option value="">— wybierz —</option>
              {STORE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Ocena (1–5)">
            <Select name="rating" defaultValue="">
              <option value="">— brak —</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{"★".repeat(n)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Notatki" className="sm:col-span-2 lg:col-span-4">
            <Input name="notes" placeholder="Uwagi, godziny otwarcia, kontakt…" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Dodaj sklep
            </Button>
          </div>
        </form>
      </Card>

      {/* Lista sklepów */}
      {!list.length ? (
        <EmptyState
          title="Brak sklepów"
          description="Dodaj sklepy z których korzystasz przy remoncie."
          className="mt-6"
        />
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((store) => (
            <Card key={store.id} className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{store.name}</p>
                  {store.category && (
                    <Badge variant="gray" className="mt-1">{store.category}</Badge>
                  )}
                </div>
                {store.rating && (
                  <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="text-xs font-medium">{store.rating}</span>
                  </div>
                )}
              </div>
              {store.notes && (
                <p className="text-xs text-muted-foreground">{store.notes}</p>
              )}
              <div className="flex items-center gap-2 pt-1 mt-auto">
                {store.url && (
                  <a href={store.url} target="_blank" rel="noopener noreferrer">
                    <Button type="button" variant="secondary" size="sm">
                      <ExternalLink className="h-3.5 w-3.5" /> Otwórz
                    </Button>
                  </a>
                )}
                <DeleteButton
                  action={deleteStoreAction.bind(null, store.id)}
                  id={store.id}
                  confirmMessage={`Usuń sklep "${store.name}"?`}
                  size="sm"
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

// Inline server action wrapper
async function deleteStoreAction(id: string, formData: FormData) {
  "use server";
  formData.set("id", id);
  const { deleteStore } = await import("@/app/actions/library");
  await deleteStore(formData);
}
