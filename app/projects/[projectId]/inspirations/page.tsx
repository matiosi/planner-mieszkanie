import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DeleteButton } from "@/components/delete-button";
import { labelFor, labels } from "@/lib/labels";
import { requireProject, signedUrl } from "@/lib/data";
import { upsertInspiration, deleteInspiration, toggleSelectedForDesigner } from "@/app/actions/inspirations";
import { Plus, Image as ImageIcon, Link as LinkIcon, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function InspirationsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: inspirations }, { data: rooms }] = await Promise.all([
    supabase
      .from("inspirations")
      .select("id,title,source,category,external_url,storage_bucket,storage_path,designer_note,selected_for_designer,room_id")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
  ]);

  const list = inspirations ?? [];
  const roomList = rooms ?? [];

  // Generuj signed URLs dla uploadowanych zdjęć
  const withUrls = await Promise.all(
    list.map(async (insp) => ({
      ...insp,
      displayUrl: insp.source === "UPLOAD"
        ? await signedUrl(insp.storage_bucket, insp.storage_path)
        : insp.external_url,
    }))
  );

  async function addInspiration(formData: FormData) {
    "use server";
    await upsertInspiration(projectId, formData);
  }

  return (
    <>
      <PageHeader
        title="Inspiracje"
        description={`${list.length} inspiracji`}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={`/projects/${projectId}/inspirations/designer-brief`}>
              Brief dla projektanta
            </Link>
          </Button>
        }
      />

      {/* Formularz dodawania */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj inspirację</h2>
        <form action={addInspiration} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" encType="multipart/form-data">
          <Field label="Tytuł *" className="sm:col-span-2">
            <Input name="title" required placeholder="np. Łazienka w stylu japandi" />
          </Field>
          <Field label="Kategoria">
            <Input name="category" placeholder="np. Łazienka, Kuchnia" />
          </Field>
          <Field label="Pomieszczenie">
            <Select name="room_id" defaultValue="">
              <option value="">— brak —</option>
              {roomList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          {/* Upload zdjęcia */}
          <Field label="Zdjęcie (upload)" className="sm:col-span-2">
            <Input name="file" type="file" accept="image/jpeg,image/png,image/webp" />
          </Field>
          {/* Link zewnętrzny */}
          <Field label="Lub link zewnętrzny" className="sm:col-span-2">
            <Input name="external_url" type="url" placeholder="https://www.pinterest.com/pin/…" />
            <input type="hidden" name="source" value="URL" />
          </Field>
          <Field label="Notatka dla projektanta" className="sm:col-span-2">
            <Input name="designer_note" placeholder="Co podoba Ci się w tej inspiracji?" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="selected_for_designer" className="h-4 w-4 rounded border-border" />
              Wybierz dla projektanta
            </label>
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Dodaj
            </Button>
          </div>
        </form>
      </Card>

      {/* Galeria */}
      {!list.length ? (
        <EmptyState
          title="Brak inspiracji"
          description="Dodaj pierwsze zdjęcie lub link powyżej."
          className="mt-6"
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {withUrls.map((insp) => {
            const roomName = roomList.find((r) => r.id === insp.room_id)?.name;
            return (
              <Card key={insp.id} className="overflow-hidden p-0">
                {/* Obraz */}
                <div className="relative aspect-video bg-muted">
                  {insp.displayUrl ? (
                    <img
                      src={insp.displayUrl}
                      alt={insp.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  {insp.selected_for_designer && (
                    <div className="absolute top-2 right-2 rounded-full bg-amber-400 p-1">
                      <Star className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-3 space-y-2">
                  <p className="text-sm font-medium leading-snug">{insp.title}</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="gray">{labelFor(labels.inspirationSource, insp.source)}</Badge>
                    {roomName && <Badge variant="gray">{roomName}</Badge>}
                    {insp.category && <Badge variant="gray">{insp.category}</Badge>}
                  </div>
                  {insp.designer_note && (
                    <p className="text-xs text-muted-foreground italic">&quot;{insp.designer_note}&quot;</p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    {/* Toggle wybrania */}
                    <form action={async (fd: FormData) => {
                      "use server";
                      fd.set("id", insp.id);
                      fd.set("selected", insp.selected_for_designer ? "false" : "true");
                      await toggleSelectedForDesigner(projectId, fd);
                    }}>
                      <Button type="submit" variant="ghost" size="sm" className="text-xs">
                        {insp.selected_for_designer ? "Odznacz" : "Wybierz ★"}
                      </Button>
                    </form>
                    {insp.external_url && (
                      <a href={insp.external_url} target="_blank" rel="noopener noreferrer">
                        <Button type="button" variant="ghost" size="sm" className="text-xs">
                          <LinkIcon className="h-3 w-3" />
                        </Button>
                      </a>
                    )}
                    <DeleteButton
                      action={deleteInspiration.bind(null, projectId)}
                      id={insp.id}
                      confirmMessage={`Usuń inspirację "${insp.title}"?`}
                      size="sm"
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
