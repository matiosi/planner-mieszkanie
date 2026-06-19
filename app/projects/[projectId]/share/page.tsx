import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DeleteButton } from "@/components/delete-button";
import { CopyButton } from "@/components/copy-button";
import { requireProjectOwner } from "@/lib/data";
import { getPublicSiteUrl } from "@/lib/env";
import { labels, labelFor } from "@/lib/labels";
import { formatDate } from "@/lib/formatters";
import { createShareLink, deleteShareLink } from "@/app/actions/share";
import { Share2 } from "lucide-react";

export default async function SharePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProjectOwner(projectId);
  const [{ data: links }, { data: rooms }] = await Promise.all([
    supabase
      .from("share_links")
      .select("id,token,scope,room_ids,expires_at,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
  ]);

  const baseUrl = getPublicSiteUrl();

  return (
    <>
      <PageHeader
        title="Udostępnianie"
        description="Twórz ograniczone, read-only paczki dla projektanta lub wykonawcy."
        actions={<Share2 className="h-5 w-5 text-muted-foreground" />}
      />

      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Nowy link</h2>
        <form action={createShareLink.bind(null, projectId)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Zakres">
            <Select name="scope" defaultValue="CONTRACTOR_PACKAGE">
              {Object.entries(labels.shareScope).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Wygasa">
            <Input name="expires_at" type="datetime-local" />
          </Field>
          <Field label="Wybrane pokoje" className="sm:col-span-2">
            <Select name="room_ids" multiple className="min-h-24">
              {(rooms ?? []).map((room) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" size="sm">Utwórz link</Button>
          </div>
        </form>
      </Card>

      <div className="mt-6 grid gap-3">
        {(links ?? []).map((link) => {
          const url = `${baseUrl}/share/${link.token}`;
          const expired = link.expires_at ? new Date(link.expires_at) < new Date() : false;
          return (
            <Card key={link.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={expired ? "red" : "blue"}>{labelFor(labels.shareScope, link.scope)}</Badge>
                    {link.expires_at && (
                      <span className="text-xs text-muted-foreground">
                        Wygasa: {formatDate(link.expires_at.slice(0, 10))}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 break-all text-xs text-muted-foreground">{url}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <CopyButton text={url} label="Kopiuj" />
                  <DeleteButton
                    action={deleteShareLink.bind(null, projectId)}
                    id={link.id}
                    confirmMessage="Usunąć link udostępniania?"
                    size="sm"
                  />
                </div>
              </div>
            </Card>
          );
        })}
        {!(links ?? []).length && (
          <p className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Nie ma jeszcze linków udostępniania.
          </p>
        )}
      </div>
    </>
  );
}
