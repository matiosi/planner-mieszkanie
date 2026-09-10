import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { requireProject, signedUrl } from "@/lib/data";
import { updateDesignerNote } from "@/app/actions/inspirations";
import { deleteSurveyScan, uploadSurveyScan } from "@/app/actions/survey-scans";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DeleteButton } from "@/components/delete-button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { Download, FileText, ScanLine } from "lucide-react";

export default async function DesignerBriefPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: rooms }, { data: inspirations }, { data: briefNotes }, { data: surveyScans }] = await Promise.all([
    supabase.from("rooms").select("id,name,area,concept_description").eq("project_id", projectId).order("sort_order"),
    supabase
      .from("inspirations")
      .select("id,title,source,category,external_url,storage_bucket,storage_path,designer_note,selected_for_designer,room_id")
      .eq("project_id", projectId)
      .eq("selected_for_designer", true),
    supabase.from("designer_brief_room_notes").select("room_id,note").eq("project_id", projectId),
    supabase
      .from("survey_scans")
      .select("id,title,room_id,storage_bucket,storage_path,original_file_name,created_at")
      .eq("project_id", projectId)
      .order("created_at"),
  ]);

  const roomList = rooms ?? [];
  const insList = inspirations ?? [];
  const scans = surveyScans ?? [];

  // Mapa notatek per pokój
  const noteMap = Object.fromEntries((briefNotes ?? []).map((n) => [n.room_id, n.note ?? ""]));

  // Generuj signed URLs
  const urlMap: Record<string, string | null> = {};
  for (const insp of insList) {
    if (insp.source === "UPLOAD" && insp.storage_bucket && insp.storage_path) {
      urlMap[insp.id] = await signedUrl(insp.storage_bucket, insp.storage_path);
    } else {
      urlMap[insp.id] = insp.external_url;
    }
  }

  const scanUrlMap: Record<string, string | null> = {};
  for (const scan of scans) {
    scanUrlMap[scan.id] = await signedUrl(scan.storage_bucket, scan.storage_path);
  }

  const insForRoom = (roomId: string) => insList.filter((i) => i.room_id === roomId);
  const noRoomIns = insList.filter((i) => !i.room_id);

  return (
    <>
      <PageHeader
        title="Brief dla projektanta"
        description="Inspiracje wybrane dla projektanta pogrupowane po pomieszczeniach."
        actions={
          <div className="flex items-center gap-2">
            <a href={`/api/projects/${projectId}/designer-brief/pdf`} download>
              <Button size="sm">
                <FileText className="h-4 w-4" />
                Pobierz PDF
              </Button>
            </a>
            <a href={`/api/projects/${projectId}/designer-brief/all`} download>
              <Button variant="secondary" size="sm">
                <Download className="h-4 w-4" />
                ZIP źródłowy
              </Button>
            </a>
          </div>
        }
      />

      {!insList.length && (
        <EmptyState
          title="Brak wybranych inspiracji"
          description="Zaznacz inspiracje jako 'Wybierz ★' w galerii inspiracji."
          className="mt-6"
        />
      )}

      <Card className="mt-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <ScanLine className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Zdjęcia ankiety</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dodaj skany odpowiedzi na ankietę. W pełnym PDF pojawią się przed inspiracjami.
            </p>
          </div>
        </div>

        <form action={uploadSurveyScan.bind(null, projectId)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Tytuł">
            <Input name="title" placeholder="np. Ankieta — strona 1" />
          </Field>
          <Field label="Pomieszczenie">
            <Select name="room_id" defaultValue="">
              <option value="">Wszystkie PDF-y briefu</option>
              {roomList.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
            </Select>
          </Field>
          <Field label="Zdjęcie ankiety *" className="sm:col-span-2">
            <Input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <PendingSubmitButton type="submit" size="sm" pendingLabel="Dodawanie…">
              <ScanLine className="h-4 w-4" /> Dodaj zdjęcie ankiety
            </PendingSubmitButton>
          </div>
        </form>

        {scans.length > 0 && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scans.map((scan) => {
              const roomName = roomList.find((room) => room.id === scan.room_id)?.name;
              return (
                <div key={scan.id} className="overflow-hidden rounded-md border border-border bg-muted/30 p-2">
                  {scanUrlMap[scan.id] ? (
                    <div className="bg-white p-2 shadow-sm dark:bg-white/90">
                      <img
                        src={scanUrlMap[scan.id]!}
                        alt={scan.title}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[3/4] w-full object-contain grayscale contrast-125 brightness-110"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[3/4] items-center justify-center bg-muted text-xs text-muted-foreground">
                      Brak podglądu
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2 px-1 pb-1 pt-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{scan.title}</p>
                      <p className="text-xs text-muted-foreground">{roomName ?? "Wszystkie PDF-y briefu"}</p>
                    </div>
                    <DeleteButton
                      action={deleteSurveyScan.bind(null, projectId)}
                      id={scan.id}
                      confirmMessage={`Usunąć zdjęcie ankiety „${scan.title}”?`}
                      size="sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="mt-6 space-y-8">
        {roomList.map((room) => {
          const roomInsp = insForRoom(room.id);
          if (!roomInsp.length) return null;
          return (
            <Card key={room.id}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{room.name}</h2>
                  {room.area && <p className="text-sm text-muted-foreground">{room.area} m²</p>}
                  {room.concept_description && (
                    <p className="text-sm text-muted-foreground mt-1">{room.concept_description}</p>
                  )}
                </div>
                <a href={`/api/projects/${projectId}/designer-brief/${room.id}`} download>
                  <Button variant="secondary" size="sm">
                    <FileText className="h-4 w-4" />
                    PDF pokoju
                  </Button>
                </a>
              </div>

              {/* Notatka per pokój */}
              <form action={async (fd: FormData) => {
                "use server";
                fd.set("room_id", room.id);
                await updateDesignerNote(projectId, fd);
              }} className="mb-4">
                <Field label="Notatka dla projektanta (ten pokój)">
                  <Textarea name="note" rows={2} defaultValue={noteMap[room.id] ?? ""} placeholder="Co jest ważne w tym pomieszczeniu?" />
                </Field>
                <Button type="submit" size="sm" className="mt-2" variant="secondary">Zapisz notatkę</Button>
              </form>

              {/* Inspiracje */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {roomInsp.map((insp) => (
                  <div key={insp.id} className="rounded-md border border-border overflow-hidden">
                    {urlMap[insp.id] && (
                      <img
                        src={urlMap[insp.id]!}
                        alt={insp.title}
                        loading="lazy"
                        decoding="async"
                        className="h-36 w-full object-cover"
                      />
                    )}
                    <div className="p-2">
                      <p className="text-sm font-medium">{insp.title}</p>
                      {insp.designer_note && (
                        <p className="text-xs text-muted-foreground mt-1 italic">&quot;{insp.designer_note}&quot;</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}

        {/* Inspiracje bez przypisanego pokoju */}
        {noRoomIns.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">Bez przypisanego pomieszczenia</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {noRoomIns.map((insp) => (
                <div key={insp.id} className="rounded-md border border-border overflow-hidden">
                  {urlMap[insp.id] && (
                    <img
                      src={urlMap[insp.id]!}
                      alt={insp.title}
                      loading="lazy"
                      decoding="async"
                      className="h-36 w-full object-cover"
                    />
                  )}
                  <div className="p-2">
                    <p className="text-sm font-medium">{insp.title}</p>
                    {insp.designer_note && (
                      <p className="text-xs text-muted-foreground mt-1 italic">&quot;{insp.designer_note}&quot;</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
