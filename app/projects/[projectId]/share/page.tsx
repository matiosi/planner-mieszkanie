import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/delete-button";
import { labelFor, labels } from "@/lib/labels";
import { formatDate } from "@/lib/formatters";
import { requireProject } from "@/lib/data";
import { createShareLink, revokeShareLink } from "@/app/actions/share";
import { Plus, Link2, Copy } from "lucide-react";
import { ShareLinkCopyButton } from "@/components/share-link-copy-button";

export default async function SharePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const { data: links } = await supabase
    .from("share_links")
    .select("id,token,scope,expires_at,created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const linkList = links ?? [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  async function addLink(formData: FormData) {
    "use server";
    await createShareLink(projectId, formData);
  }

  return (
    <>
      <PageHeader
        title="Udostępnianie"
        description="Zarządzaj linkami do udostępniania projektu"
      />

      {/* Create link form */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Utwórz link do udostępnienia</h2>
        <form action={addLink} className="grid gap-4 sm:grid-cols-3">
          <Field label="Zakres dostępu">
            <Select name="scope" defaultValue="WHOLE_PROJECT">
              {Object.entries(labels.shareScope).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Wygasa (opcjonalnie)">
            <Input name="expires_at" type="datetime-local" />
          </Field>
          <div className="flex items-end">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Utwórz link
            </Button>
          </div>
        </form>
      </Card>

      {/* Links list */}
      {!linkList.length ? (
        <EmptyState title="Brak linków" description="Utwórz pierwszy link do udostępnienia." className="mt-6" />
      ) : (
        <Card className="mt-6">
          <h2 className="font-semibold mb-4">Aktywne linki ({linkList.length})</h2>
          <div className="space-y-3">
            {linkList.map((link) => {
              const url = `${siteUrl}/share/${link.token}`;
              const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
              return (
                <div key={link.id} className={`rounded-md border border-border p-3 ${isExpired ? "opacity-50" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Badge variant="gray">{labelFor(labels.shareScope, link.scope)}</Badge>
                        {isExpired && <Badge variant="red">Wygasły</Badge>}
                        {link.expires_at && !isExpired && (
                          <span className="text-xs text-muted-foreground">
                            Wygasa: {formatDate(link.expires_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-mono truncate">{url}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Utworzono: {formatDate(link.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <ShareLinkCopyButton url={url} />
                      <DeleteButton
                        action={revokeShareLink.bind(null, projectId)}
                        id={link.id}
                        confirmMessage="Cofnij ten link do udostępnienia?"
                        size="sm"
                        label="Cofnij"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}
