import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireProject, signedUrl } from "@/lib/data";
import { updateDesignerNote } from "@/app/actions/inspirations";
import { Textarea } from "@/components/ui/textarea";
import { Star, Download, FileText } from "lucide-react";

export default async function DesignerBriefPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase, project } = await requireProject(projectId);

  const [{ data: rooms }, { data: inspirations }, { data: briefNotes }] = await Promise.all([
    supabase.from("rooms").select("id,name,area,concept_description").eq("project_id", projectId).order("sort_order"),
    supabase
      .from("inspirations")
      .select("id,title,source,category,external_url,storage_bucket,storage_path,designer_note,selected_for_designer,room_id")
      .eq("project_id", projectId)
      .eq("selected_for_designer", true),
    supabase.from("designer_brief_room_notes").select("room_id,note").eq("project_id", projectId),
  ]);

  const roomList = rooms ?? [];
  const insList = inspirations ?? [];

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

  const insForRoom = (roomId: string) => insList.filter((i) => i.room_id === roomId);
  const noRoomIns = insList.filter((i) => !i.room_id);

  return (
    <>
      <PageHeader
        title="Brief dla projektanta"
        description="Inspiracje wybrane dla projektanta pogrupowane po pomieszczeniach."
        actions={
          <a href={`/api/projects/${projectId}/designer-brief/all`} download>
            <Button size="sm">
              <Download className="h-4 w-4" />
              Pobierz ZIP
            </Button>
          </a>
        }
      />

      {!insList.length && (
        <EmptyState
          title="Brak wybranych inspiracji"
          description="Zaznacz inspiracje jako 'Wybierz ★' w galerii inspiracji."
          className="mt-6"
        />
      )}

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
                    <img src={urlMap[insp.id]!} alt={insp.title} className="h-36 w-full object-cover" />
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
