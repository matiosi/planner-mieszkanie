import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/delete-button";
import { formatDate } from "@/lib/formatters";
import { requireProject, signedUrl } from "@/lib/data";
import { uploadProgressPhoto, deleteProgressPhoto } from "@/app/actions/progress";
import { Plus } from "lucide-react";

export default async function ProgressPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: photos }, { data: rooms }] = await Promise.all([
    supabase
      .from("progress_photos")
      .select("id,title,note,photo_date,room_id,storage_bucket,storage_path")
      .eq("project_id", projectId)
      .order("photo_date", { ascending: false }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
  ]);

  const list = photos ?? [];
  const roomList = rooms ?? [];

  // Group by date
  const byDate = list.reduce<Record<string, typeof list>>((acc, p) => {
    const key = p.photo_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  // Generate signed URLs
  const urlMap: Record<string, string | null> = {};
  for (const photo of list) {
    urlMap[photo.id] = await signedUrl(photo.storage_bucket, photo.storage_path);
  }

  async function addPhoto(formData: FormData) {
    "use server";
    await uploadProgressPhoto(projectId, formData);
  }

  return (
    <>
      <PageHeader
        title="Postęp prac"
        description={`${list.length} zdjęć`}
      />

      {/* Upload form */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj zdjęcie</h2>
        <form action={addPhoto} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Zdjęcie *" className="sm:col-span-2">
            <Input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
          </Field>
          <Field label="Tytuł">
            <Input name="title" placeholder="np. Łazienka po wylewce" />
          </Field>
          <Field label="Data">
            <Input name="photo_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
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

      {/* Photos grid */}
      {!list.length ? (
        <EmptyState title="Brak zdjęć" description="Dodaj pierwsze zdjęcie postępu prac." className="mt-6" />
      ) : (
        <div className="mt-6 space-y-8">
          {Object.entries(byDate).map(([date, datePhotos]) => (
            <div key={date}>
              <h2 className="font-semibold mb-3">{formatDate(date)}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {datePhotos.map((photo) => {
                  const roomName = roomList.find((r) => r.id === photo.room_id)?.name;
                  const url = urlMap[photo.id];
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
                        {roomName && <Badge variant="gray">{roomName}</Badge>}
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
  );
}
