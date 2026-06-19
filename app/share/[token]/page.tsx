import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { labelFor, labels, statusVariant } from "@/lib/labels";

type SharePackage = {
  scope: string;
  expires_at: string | null;
  project: { name: string; style: string | null; area: number | null; description: string | null };
  rooms: Array<{ id: string; name: string; area: number | null; status: string; concept_description: string | null }>;
  technical: Array<{ room_id: string; ceiling_height: number | null; flooring_area: number | null; wall_area: number | null; skirting_length: number | null; notes: string | null }>;
  inspirations: Array<{ id: string; room_id: string | null; title: string; category: string | null; external_url: string | null; designer_note: string | null }>;
  plans: Array<{ id: string; plan_type: string; title: string; version_label: string | null; original_file_name: string | null }>;
  punch_list: Array<{ id: string; title: string; severity: string; status: string; description: string | null; due_date: string | null }>;
  vendor_scope: Array<{ id: string; title: string; description: string | null; included: boolean; price_included: boolean; price_note: string | null }>;
};

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_share_package", { p_token: token });
  if (!data) notFound();

  const pack = data as SharePackage;
  const roomName = (roomId?: string | null) => pack.rooms.find((room) => room.id === roomId)?.name;

  return (
    <main className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card>
          <Badge variant="blue">{labelFor(labels.shareScope, pack.scope)}</Badge>
          <h1 className="mt-3 text-2xl font-bold">{pack.project.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pack.project.style || "Projekt wykończenia"} {pack.project.area ? `· ${pack.project.area} m²` : ""}
          </p>
          {pack.project.description && <p className="mt-4 text-sm">{pack.project.description}</p>}
        </Card>

        {!!pack.rooms.length && (
          <Card>
            <h2 className="font-semibold mb-3">Pomieszczenia</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {pack.rooms.map((room) => (
                <div key={room.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{room.name}</p>
                    <Badge variant={statusVariant(room.status)}>{labelFor(labels.roomStatus, room.status)}</Badge>
                  </div>
                  {room.concept_description && <p className="mt-2 text-sm text-muted-foreground">{room.concept_description}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {!!pack.technical.length && (
          <Card>
            <h2 className="font-semibold mb-3">Karty techniczne</h2>
            <div className="grid gap-2">
              {pack.technical.map((item) => (
                <div key={item.room_id} className="rounded-md bg-muted/50 p-3 text-sm">
                  <p className="font-medium">{roomName(item.room_id) ?? "Pomieszczenie"}</p>
                  <p className="text-muted-foreground">
                    Podłoga: {item.flooring_area ?? "—"} m² · Ściany: {item.wall_area ?? "—"} m² · Listwy: {item.skirting_length ?? "—"} mb
                  </p>
                  {item.notes && <p className="mt-1">{item.notes}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {!!pack.inspirations.length && (
          <Card>
            <h2 className="font-semibold mb-3">Inspiracje</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {pack.inspirations.map((item) => (
                <div key={item.id} className="rounded-md border border-border p-3">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{roomName(item.room_id) ?? item.category ?? "Inspiracja"}</p>
                  {item.designer_note && <p className="mt-2 text-sm">{item.designer_note}</p>}
                  {item.external_url && <p className="mt-2 break-all text-xs text-primary">{item.external_url}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {!!pack.plans.length && (
          <Card>
            <h2 className="font-semibold mb-3">Plany</h2>
            <div className="space-y-2">
              {pack.plans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                  <span>{plan.title}</span>
                  <Badge variant="gray">{labelFor(labels.planType, plan.plan_type)}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!!pack.vendor_scope.length && (
          <Card>
            <h2 className="font-semibold mb-3">Zakres prac</h2>
            <div className="space-y-2">
              {pack.vendor_scope.map((item) => (
                <div key={item.id} className="rounded-md border border-border p-3">
                  <p className="font-medium">{item.title}</p>
                  {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.included ? "W zakresie" : "Poza zakresem"} · {item.price_included ? "W cenie" : "Poza ceną"}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!!pack.punch_list.length && (
          <Card>
            <h2 className="font-semibold mb-3">Odbiór / usterki</h2>
            <div className="space-y-2">
              {pack.punch_list.map((item) => (
                <div key={item.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{item.title}</p>
                    <Badge variant={statusVariant(item.status)}>{labelFor(labels.punchListStatus, item.status)}</Badge>
                  </div>
                  {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
