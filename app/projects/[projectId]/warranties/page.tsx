import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/formatters";
import { requireProject, signedUrl } from "@/lib/data";
import { Download, Shield } from "lucide-react";
import Link from "next/link";

export default async function WarrantiesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: documents }, { data: rooms }, { data: vendors }] = await Promise.all([
    supabase
      .from("documents")
      .select("id,title,type,original_file_name,purchase_date,warranty_until,amount,seller,storage_bucket,storage_path,room_id,vendor_id")
      .eq("project_id", projectId)
      .not("warranty_until", "is", null)
      .order("warranty_until", { ascending: true }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
    supabase.from("vendors").select("id,name").eq("project_id", projectId).order("name"),
  ]);

  const list = documents ?? [];
  const roomList = rooms ?? [];
  const vendorList = vendors ?? [];

  const today = new Date();
  const in30days = new Date(Date.now() + 30 * 86400000);

  const withUrls = await Promise.all(
    list.map(async (doc) => ({
      ...doc,
      url: await signedUrl(doc.storage_bucket, doc.storage_path),
    }))
  );

  const active = withUrls.filter(
    (d) => d.warranty_until && new Date(d.warranty_until) >= today
  );
  const expired = withUrls.filter(
    (d) => d.warranty_until && new Date(d.warranty_until) < today
  );

  function warrantyStatus(until: string) {
    const date = new Date(until);
    if (date < today) return { label: "Wygasła", variant: "red" as const };
    if (date <= in30days) return { label: "Wygasa wkrótce", variant: "amber" as const };
    return { label: "Aktywna", variant: "green" as const };
  }

  return (
    <>
      <PageHeader
        title="Gwarancje"
        description={`${active.length} aktywnych, ${expired.length} wygasłych`}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={`/projects/${projectId}/documents`}>Wszystkie dokumenty</Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{active.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Aktywnych</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-amber-600">
            {active.filter((d) => d.warranty_until && new Date(d.warranty_until) <= in30days).length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Wygasa w 30 dni</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-red-600">{expired.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Wygasłych</p>
        </Card>
      </div>

      {!list.length ? (
        <EmptyState
          title="Brak gwarancji"
          description="Dodaj dokumenty z datą ważności gwarancji w module Dokumenty."
          className="mt-6"
        />
      ) : (
        <div className="mt-6 space-y-6">
          {/* Active warranties */}
          {active.length > 0 && (
            <Card>
              <h2 className="font-semibold mb-3">Aktywne gwarancje</h2>
              <div className="space-y-3">
                {active.map((doc) => {
                  const roomName = roomList.find((r) => r.id === doc.room_id)?.name;
                  const vendorName = vendorList.find((v) => v.id === doc.vendor_id)?.name;
                  const status = warrantyStatus(doc.warranty_until!);
                  return (
                    <div key={doc.id} className="flex items-start gap-3 rounded-md border border-border p-3">
                      <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{doc.title}</p>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mt-0.5">
                          Gwarancja do: <strong>{formatDate(doc.warranty_until!)}</strong>
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {roomName && <Badge variant="gray">{roomName}</Badge>}
                          {vendorName && <Badge variant="gray">{vendorName}</Badge>}
                          {doc.purchase_date && (
                            <span className="text-xs text-muted-foreground">
                              Zakup: {formatDate(doc.purchase_date)}
                            </span>
                          )}
                        </div>
                        {doc.url && (
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" download={doc.original_file_name} className="mt-2 inline-block">
                            <Button variant="secondary" size="sm">
                              <Download className="h-3 w-3" /> Pobierz
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Expired */}
          {expired.length > 0 && (
            <Card>
              <h2 className="font-semibold mb-3 text-muted-foreground">Wygasłe</h2>
              <div className="space-y-2">
                {expired.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-md border border-border p-3 opacity-60">
                    <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">Wygasła: {formatDate(doc.warranty_until!)}</p>
                    </div>
                    <Badge variant="red">Wygasła</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
