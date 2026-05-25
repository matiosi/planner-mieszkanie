import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/delete-button";
import { labelFor, labels, statusVariant } from "@/lib/labels";
import { formatDate } from "@/lib/formatters";
import { requireProject } from "@/lib/data";
import { deleteProduct } from "@/app/actions/products";
import { Truck, Package } from "lucide-react";
import Link from "next/link";

export default async function DeliveriesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: products }, { data: rooms }] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,store,price,delivery_status,order_number,ordered_at,expected_delivery_date,delivered_at,tracking_url,required_by,room_id")
      .eq("project_id", projectId)
      .not("delivery_status", "eq", "NOT_ORDERED")
      .order("expected_delivery_date", { ascending: true, nullsFirst: false }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
  ]);

  const list = products ?? [];
  const roomList = rooms ?? [];

  const statusOrder = ["DELAYED", "SHIPPED", "ORDERED", "DELIVERED", "RETURNED"];
  const grouped = statusOrder.reduce<Record<string, typeof list>>((acc, s) => {
    acc[s] = list.filter((p) => p.delivery_status === s);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Dostawy"
        description={`${list.length} zamówionych produktów`}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={`/projects/${projectId}/products`}>← Produkty</Link>
          </Button>
        }
      />

      {/* Status summary */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { key: "DELAYED", label: "Opóźnione", color: "text-red-600" },
          { key: "SHIPPED", label: "W drodze", color: "text-blue-600" },
          { key: "ORDERED", label: "Zamówione", color: "text-amber-600" },
          { key: "DELIVERED", label: "Dostarczone", color: "text-green-600" },
        ].map(({ key, label, color }) => (
          <Card key={key} className="text-center">
            <p className={`text-2xl font-bold ${color}`}>{grouped[key]?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {!list.length ? (
        <EmptyState
          title="Brak zamówień"
          description="Oznacz produkty jako zamówione, aby śledzić dostawy."
          className="mt-6"
        />
      ) : (
        <div className="mt-6 space-y-6">
          {statusOrder.map((status) => {
            const items = grouped[status];
            if (!items?.length) return null;
            return (
              <div key={status}>
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge variant={statusVariant(status)}>
                    {labelFor(labels.deliveryStatus, status)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">({items.length})</span>
                </h2>
                <div className="space-y-3">
                  {items.map((product) => {
                    const roomName = roomList.find((r) => r.id === product.room_id)?.name;
                    return (
                      <Card key={product.id} className="flex items-start gap-3">
                        <div className="shrink-0 rounded-md bg-muted p-2">
                          {product.delivery_status === "DELIVERED" ? (
                            <Package className="h-5 w-5 text-green-600" />
                          ) : (
                            <Truck className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{product.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {product.store && <Badge variant="gray">{product.store}</Badge>}
                            {roomName && <Badge variant="gray">{roomName}</Badge>}
                            {product.order_number && (
                              <span className="text-xs text-muted-foreground">Nr: {product.order_number}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-1">
                            {product.ordered_at && (
                              <span className="text-xs text-muted-foreground">
                                Zamówiono: {formatDate(product.ordered_at)}
                              </span>
                            )}
                            {product.expected_delivery_date && (
                              <span className="text-xs text-muted-foreground">
                                Oczekiwana dostawa: {formatDate(product.expected_delivery_date)}
                              </span>
                            )}
                            {product.delivered_at && (
                              <span className="text-xs text-green-600">
                                Dostarczone: {formatDate(product.delivered_at)}
                              </span>
                            )}
                          </div>
                          {product.tracking_url && (
                            <a
                              href={product.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline mt-1 block"
                            >
                              Śledź przesyłkę →
                            </a>
                          )}
                        </div>
                        <DeleteButton
                          action={deleteProduct.bind(null, projectId)}
                          id={product.id}
                          confirmMessage={`Usuń produkt "${product.name}"?`}
                          size="sm"
                        />
                      </Card>
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
