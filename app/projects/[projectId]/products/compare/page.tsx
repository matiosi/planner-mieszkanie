import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { labelFor, labels, statusVariant } from "@/lib/labels";
import { formatCurrency } from "@/lib/formatters";
import { requireProject } from "@/lib/data";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default async function ProductsComparePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  // Fetch products with SHORTLISTED or SELECTED status for comparison
  const [{ data: products }, { data: rooms }] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,category,price,url,image_url,store,status,purchase_priority,room_id,notes")
      .eq("project_id", projectId)
      .in("status", ["FOUND", "SHORTLISTED", "SELECTED"])
      .order("category")
      .order("price", { ascending: true, nullsFirst: false }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
  ]);

  const list = products ?? [];
  const roomList = rooms ?? [];

  // Group by category
  const byCategory = list.reduce<Record<string, typeof list>>((acc, p) => {
    const key = p.category ?? "Inne";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Porównanie produktów"
        description="Porównaj produkty według kategorii"
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={`/projects/${projectId}/products`}>← Produkty</Link>
          </Button>
        }
      />

      {!list.length ? (
        <EmptyState
          title="Brak produktów do porównania"
          description="Dodaj produkty ze statusem FOUND, SHORTLISTED lub SELECTED."
          className="mt-6"
        />
      ) : (
        <div className="mt-6 space-y-8">
          {Object.entries(byCategory).map(([category, items]) => (
            <div key={category}>
              <h2 className="font-semibold mb-3">{category} ({items.length})</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((product) => {
                  const roomName = roomList.find((r) => r.id === product.room_id)?.name;
                  return (
                    <Card key={product.id} className={product.status === "SELECTED" ? "ring-2 ring-primary" : ""}>
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-32 w-full object-cover rounded-md mb-3"
                        />
                      )}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium text-sm leading-snug">{product.name}</p>
                        <Badge variant={statusVariant(product.status)}>
                          {labelFor(labels.productStatus, product.status)}
                        </Badge>
                      </div>
                      {product.price && (
                        <p className="text-lg font-bold text-primary mb-1">
                          {formatCurrency(product.price)}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {product.store && <Badge variant="gray">{product.store}</Badge>}
                        {roomName && <Badge variant="gray">{roomName}</Badge>}
                        <Badge variant={statusVariant(product.purchase_priority)}>
                          {labelFor(labels.priority, product.purchase_priority)}
                        </Badge>
                      </div>
                      {product.notes && (
                        <p className="text-xs text-muted-foreground mb-2">{product.notes}</p>
                      )}
                      {product.url && (
                        <a href={product.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="text-xs w-full">
                            <ExternalLink className="h-3 w-3" /> Otwórz w sklepie
                          </Button>
                        </a>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
