import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/delete-button";
import { BeforeAfterSlider } from "@/components/before-after-slider";
import { formatDate } from "@/lib/formatters";
import { requireProject, signedUrl } from "@/lib/data";
import { uploadProgressPhoto, deleteProgressPhoto } from "@/app/actions/progress";
import { Plus } from "lucide-react";
import Link from "next/link";

const PHASES = [
  { value: "", label: "Wszystkie" },
  { value: "BEFORE", label: "Przed" },
  { value: "DURING", label: "W trakcie" },
  { value: "AFTER", label: "Po" },
] as const;

const PHASE_LABELS: Record<string, { label: string; variant: "gray" | "amber" | "green" | "blue" }> = {
  BEFORE: { label: "Przed", variant: "gray" },
  DURING: { label: "W trakcie", variant: "amber" },
  AFTER: { label: "Po", variant: "green" },
};

export default async function ProgressPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ phase?: string; view?: string }>;
}) {
  const { projectId } = await params;
  const { phase: phaseFilter = "", view = "gallery" } = await searchParams;
  const { supabase } = await requireProject(projectId);

  const [{ data: photos }, { data: rooms }] = await Promise.all([
    supabase
      .from("progress_photos")
      .select("id,title,note,photo_date,room_id,storage_bucket,storage_path,phase")
      .eq("project_id", projectId)
      .order("photo_date", { ascending: false }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
  ]);

  const allPhotos = photos ?? [];
  const roomList = rooms ?? [];

  // Filtruj po fazie
  const filtered = phaseFilter
    ? allPhotos.filter((p) => (p as { phase?: string }).phase === phaseFilter)
    : allPhotos;

  // Group by date
  const byDate = filtered.reduce<Record<string, typeof filtered>>((acc, p) => {
    const key = p.photo_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  // Signed URLs dla wszystkich zdjęć
  const urlMap: Record<string, string | null> = {};
  for (const photo of allPhotos) {
    urlMap[photo.id] = await signedUrl(photo.storage_bucket, photo.storage_path);
  }

  // Zdjęcia do porównania (z URL-ami)
  const photosWithUrls = allPhotos
    .filter((p) => urlMap[p.id])
    .map((p) => ({
      id: p.id,
      title: p.title,
      url: urlMap[p.id]!,
      roomName: roomList.find((r) => r.id === p.room_id)?.name ?? null,
      phase: (p as { phase?: string }).phase ?? "DURING",
    }));

  const beforePhotos = photosWithUrls.filter((p) => p.phase === "BEFORE");
  const afterPhotos = photosWithUrls.filter((p) => p.phase === "AFTER");

  async function addPhoto(formData: FormData) {
    "use server";
    await uploadProgressPhoto(projectId, formData);
  }

  const basePath = `/projects/${projectId}/progress`;

  return (
    <>
      <PageHeader
        title="Postęp prac"
        description={`${allPhotos.length} zdjęć`}
      />

      {/* Upload form */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj zdjęcie</h2>
        <form action={addPhoto} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Zdjęcie *" className="sm:col-span-2">
            <Input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
          </Field>
          <Field label="Etap">
            <Select name="phase" defaultValue="DURING">
              <option value="BEFORE">Przed remontem</option>
              <option value="DURING">W trakcie</option>
              <option value="AFTER">Po remoncie</option>
            </Select>
          </Field>
          <Field label="Data">
            <Input name="photo_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
          </Field>
          <Field label="Tytuł">
            <Input name="title" placeholder="np. Łazienka po wylewce" />
          </Field>
          <Field label="Pomieszczenie">
            <Select name="room_id" defaultValue="">
              <option value="">— brak —</option>
              {roomList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="Notatka" className="sm:col-span-2">
            <Input name="note" placeholder="Co widać na zdjęciu?" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Dodaj zdjęcie
            </Button>
          </div>
        </form>
      </Card>

      {/* Zakładki — filtrowanie + widok porównania */}
      <div className="mt-6 flex items-center gap-1 flex-wrap">
        {PHASES.map((ph) => (
          <Link key={ph.value} href={ph.value ? `${basePath}?phase=${ph.value}` : basePath}>
            <Button
              variant={phaseFilter === ph.value ? "primary" : "secondary"}
              size="sm"
            >
              {ph.label}
              {ph.value && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({allPhotos.filter((p) => (p as { phase?: string }).phase === ph.value).length})
                </span>
              )}
            </Button>
          </Link>
        ))}
        <div className="ml-auto">
          <Link href={`${basePath}?view=compare`}>
            <Button
              variant={view === "compare" ? "primary" : "secondary"}
              size="sm"
            >
              Porównaj przed/po
            </Button>
          </Link>
        </div>
      </div>

      {/* Tryb porównania */}
      {view === "compare" ? (
        <Card className="mt-4">
          <h2 className="font-semibold mb-4">Porównanie przed / po</h2>
          <BeforeAfterSlider before={beforePhotos} after={afterPhotos} />
        </Card>
      ) : (
        <>
          {!filtered.length ? (
            <EmptyState
              title="Brak zdjęć"
              description={phaseFilter ? "Brak zdjęć dla tego etapu." : "Dodaj pierwsze zdjęcie postępu prac."}
              className="mt-6"
            />
          ) : (
            <div className="mt-4 space-y-8">
              {Object.entries(byDate).map(([date, datePhotos]) => (
                <div key={date}>
                  <h2 className="font-semibold mb-3">{formatDate(date)}</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {datePhotos.map((photo) => {
                      const roomName = roomList.find((r) => r.id === photo.room_id)?.name;
                      const url = urlMap[photo.id];
                      const phaseInfo = PHASE_LABELS[(photo as { phase?: string }).phase ?? "DURING"];
                      return (
                        <Card key={photo.id} className="overflow-hidden p-0">
                          {url && (
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={url}
                                alt={photo.title ?? "Zdjęcie postępu"}
                                className="h-40 w-full object-cover"
                              />
                            </a>
                          )}
                          <div className="p-3 space-y-1">
                            {photo.title && <p className="text-sm font-medium">{photo.title}</p>}
                            <div className="flex flex-wrap gap-1">
                              {phaseInfo && <Badge variant={phaseInfo.variant}>{phaseInfo.label}</Badge>}
                              {roomName && <Badge variant="gray">{roomName}</Badge>}
                            </div>
                            {photo.note && (
                              <p className="text-xs text-muted-foreground">{photo.note}</p>
                            )}
                            <div className="pt-1">
                              <DeleteButton
                                action={deleteProgressPhoto.bind(null, projectId)}
                                id={photo.id}
                                confirmMessage="Usuń to zdjęcie?"
                                size="sm"
                              />
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
