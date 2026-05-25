import { updateDesignerNote } from "@/app/actions";
import { Button, Card, Field, LinkButton, PageHeader, inputClass } from "@/components/ui";
import { requireProject } from "@/lib/data";

export default async function DesignerBriefPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);
  const [rooms, notes, inspirations] = await Promise.all([
    supabase.from("rooms").select("*").eq("project_id", projectId).order("name"),
    supabase.from("designer_brief_room_notes").select("*").eq("project_id", projectId),
    supabase.from("inspirations").select("*").eq("project_id", projectId).eq("selected_for_designer", true)
  ]);

  return (
    <>
      <PageHeader
        title="Briefy projektowe"
        description="Każde pomieszczenie generuje osobny PDF. Globalna akcja pobiera ZIP ze wszystkimi briefami."
        actions={<LinkButton href={`/api/projects/${projectId}/designer-brief/all`} variant="secondary">Pobierz ZIP</LinkButton>}
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {rooms.data?.map((room) => {
          const note = notes.data?.find((item) => item.room_id === room.id);
          const count = inspirations.data?.filter((item) => item.room_id === room.id).length ?? 0;
          return (
            <Card key={room.id}>
              <h2 className="text-lg font-semibold">{room.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Wybrane inspiracje: {count}</p>
              <form action={updateDesignerNote.bind(null, projectId)} className="mt-4 grid gap-3">
                <input type="hidden" name="room_id" value={room.id} />
                <Field label="Notatka do briefu"><textarea className={inputClass} name="note" rows={4} defaultValue={note?.note ?? ""} /></Field>
                <div className="flex flex-wrap gap-2">
                  <Button>Zapisz notatkę</Button>
                  <LinkButton href={`/api/projects/${projectId}/designer-brief/${room.id}`} variant="secondary">Pobierz PDF</LinkButton>
                </div>
              </form>
            </Card>
          );
        })}
      </div>
    </>
  );
}
