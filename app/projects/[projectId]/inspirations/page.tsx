import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { InspirationGallery } from "@/components/inspiration-gallery";
import { ImportUrlForm } from "@/components/import-url-form";
import { requireProject, signedUrl } from "@/lib/data";
import { upsertInspiration } from "@/app/actions/inspirations";
import { Plus } from "lucide-react";
import Link from "next/link";

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

  const withUrls = await Promise.all(
    list.map(async (insp) => ({
      ...insp,
      displayUrl: insp.source === "UPLOAD"
        ? await signedUrl(insp.storage_bucket, insp.storage_path)
        : insp.external_url,
    }))
  );

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

      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj inspirację</h2>
        <form action={upsertInspiration.bind(null, projectId)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <Field label="Zdjęcie (upload)" className="sm:col-span-2">
            <Input name="file" type="file" accept="image/jpeg,image/png,image/webp" />
          </Field>
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

      <Card className="mt-4">
        <h2 className="font-semibold mb-1">Importuj z linku</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Wklej link do pina Pinterest, strony z inspiracją lub bezpośredni URL do zdjęcia — obraz zostanie pobrany i zapisany.
        </p>
        <ImportUrlForm projectId={projectId} roomList={roomList} />
      </Card>

      {!list.length ? (
        <EmptyState
          title="Brak inspiracji"
          description="Dodaj pierwsze zdjęcie lub link powyżej."
          className="mt-6"
        />
      ) : (
        <InspirationGallery
          projectId={projectId}
          inspirations={withUrls}
          roomList={roomList}
        />
      )}
    </>
  );
}
