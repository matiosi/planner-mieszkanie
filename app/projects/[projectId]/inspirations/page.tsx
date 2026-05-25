import { deleteInspiration, upsertInspiration } from "@/app/actions";
import { Badge, Button, Card, Field, LinkButton, PageHeader, inputClass } from "@/components/ui";
import { labelFor, labels } from "@/lib/labels";
import { requireProject, signedUrl } from "@/lib/data";

export default async function InspirationsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);
  const [inspirationsResult, rooms] = await Promise.all([
    supabase.from("inspirations").select("*, rooms(name)").eq("project_id", projectId).order("created_at", { ascending: false }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("name")
  ]);
  const inspirations = await Promise.all((inspirationsResult.data ?? []).map(async (item) => ({
    ...item,
    signedUrl: await signedUrl(item.storage_bucket, item.storage_path)
  })));

  return (
    <>
      <PageHeader
        title="Inspiracje"
        description="Zdjęcia i linki przypisane do pomieszczeń, z wyborem materiałów dla projektanta."
        actions={<LinkButton href={`/projects/${projectId}/inspirations/designer-brief`} variant="secondary">Briefy projektowe</LinkButton>}
      />
      <Card className="mt-6">
        <form action={upsertInspiration.bind(null, projectId)} className="grid gap-3 md:grid-cols-6">
          <Field label="Tytuł"><input className={inputClass} name="title" required /></Field>
          <Field label="Pokój"><select className={inputClass} name="room_id"><option value="">Cały projekt</option>{rooms.data?.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></Field>
          <Field label="Kategoria"><input className={inputClass} name="category" /></Field>
          <Field label="Link zewnętrzny"><input className={inputClass} name="external_url" type="url" /></Field>
          <Field label="Zdjęcie"><input className={inputClass} name="file" type="file" accept="image/jpeg,image/png,image/webp" /></Field>
          <div className="flex items-end"><Button className="w-full">Dodaj</Button></div>
          <Field label="Notatka dla projektanta"><input className={inputClass} name="designer_note" /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="selected_for_designer" /> Wybrane do briefu</label>
        </form>
      </Card>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {inspirations.map((item) => (
          <Card key={item.id}>
            {item.signedUrl ? <img src={item.signedUrl} alt="" className="mb-4 aspect-video w-full rounded-md object-cover" /> : null}
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">{item.external_url ? <a href={item.external_url} target="_blank">{item.title}</a> : item.title}</h2>
              <Badge>{labelFor(labels.inspirationSource, item.source)}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{item.rooms?.name ?? "Cały projekt"} · {item.category || "Bez kategorii"}</p>
            <p className="mt-3 text-sm">{item.designer_note || "Brak notatki dla projektanta"}</p>
            {item.selected_for_designer ? <div className="mt-3"><Badge tone="green">Wybrane do briefu</Badge></div> : null}
            <form action={deleteInspiration.bind(null, projectId)} className="mt-4"><input type="hidden" name="id" value={item.id} /><Button variant="danger">Usuń</Button></form>
          </Card>
        ))}
      </div>
    </>
  );
}
