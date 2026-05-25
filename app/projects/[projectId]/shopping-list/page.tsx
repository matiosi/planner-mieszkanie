import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { labelFor, labels, statusVariant } from "@/lib/labels";
import { formatCurrency } from "@/lib/formatters";
import { requireProject } from "@/lib/data";
import { ShoppingCart, ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function ShoppingListPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: products }, { data: rooms }] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,store,url,price,status,purchase_priority,delivery_status,room_id,required_by")
      .eq("project_id", projectId)
      .in("status", ["FOUND", "SHORTLISTED", "SELECTED"])
      .eq("delivery_status", "NOT_ORDERED")
      .order("purchase_priority")
      .order("required_by", { ascending: true, nullsFirst: false }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
  ]);

  const list = products ?? [];
  const roomList = rooms ?? [];

  const totalEstimate = list.reduce((s, p) => s + (p.price ?? 0), 0);

  // Group by priority
  const priorityOrder = ["URGENT", "HIGH", "MEDIUM", "LOW"];
  const grouped = priorityOrder.reduce<Record<string, typeof list>>((acc, p) => {
    acc[p] = list.filter((item) => item.purchase_priority === p);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Lista zakupów"
        description={`${list.length} produktów do zamówienia`}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={`/projects/${projectId}/products`}>Wszystkie produkty</Link>
          </Button>
        }
      />

      {list.length > 0 && (
        <Card className="mt-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Szacowany koszt zakupów</p>
            <p className="text-2xl font-bold mt-0.5">{formatCurrency(totalEstimate)}</p>
          </div>
          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
        </Card>
      )}

      {!list.length ? (
        <EmptyState
          title="Brak produktów do zakupu"
          description="Dodaj produkty ze statusem SHORTLISTED lub SELECTED."
          className="mt-6"
        />
      ) : (
        <div className="mt-6 space-y-6">
          {priorityOrder.map((priority) => {
            const items = grouped[priority];
            if (!items?.length) return null;
            return (
              <div key={priority}>
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge variant={statusVariant(priority)}>
                    {labelFor(labels.priority, priority)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({items.length} szt., {formatCurrency(items.reduce((s, p) => s + (p.price ?? 0), 0))})
                  </span>
                </h2>
                <div className="space-y-2">
                  {items.map((product) => {
                    const roomName = roomList.find((r) => r.id === product.room_id)?.name;
                    return (
                      <div key={product.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            {product.price && (
                              <span className="font-semibold text-sm shrink-0">{formatCurrency(product.price)}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant={statusVariant(product.status)}>
                              {labelFor(labels.productStatus, product.status)}
                            </Badge>
                            {product.store && <Badge variant="gray">{product.store}</Badge>}
                            {roomName && <Badge variant="gray">{roomName}</Badge>}
                          </div>
                        </div>
                        {product.url && (
                          <a href={product.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
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
