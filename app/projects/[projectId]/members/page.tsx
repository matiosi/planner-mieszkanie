import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/delete-button";
import { CopyButton } from "@/components/copy-button";
import { requireProject } from "@/lib/data";
import { getPublicSiteUrl } from "@/lib/env";
import { inviteMember, removeMember, revokeInvitation } from "@/app/actions/members";
import { Users2, Clock } from "lucide-react";

const ROLES = [
  { value: "EDITOR", label: "Edytor" },
  { value: "VIEWER", label: "Obserwator" },
  { value: "DESIGNER", label: "Projektant" },
  { value: "CONTRACTOR", label: "Wykonawca" },
];

const ROLE_VARIANTS: Record<string, "green" | "blue" | "gray" | "amber"> = {
  OWNER: "green",
  EDITOR: "blue",
  VIEWER: "gray",
  DESIGNER: "amber",
  CONTRACTOR: "amber",
};

export default async function MembersPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase, project } = await requireProject(projectId);

  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase
      .from("project_members")
      .select("id,role,created_at,user_id")
      .eq("project_id", projectId)
      .order("created_at"),
    supabase
      .from("pending_invitations")
      .select("id,email,role,token,created_at")
      .eq("project_id", projectId)
      .order("created_at"),
  ]);

  const memberList = members ?? [];
  const invitationList = invitations ?? [];

  const baseUrl = getPublicSiteUrl();

  return (
    <>
      <PageHeader
        title="Członkowie projektu"
        description="Zaproś partnerkę lub projektanta do wspólnej pracy nad projektem."
        actions={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users2 className="h-4 w-4" />
            {memberList.length + 1} osób
          </div>
        }
      />

      {/* Formularz zaproszenia */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Zaproś osobę</h2>
        <form action={inviteMember.bind(null, projectId)} className="grid gap-4 sm:grid-cols-3">
          <Field label="Email *" className="sm:col-span-2">
            <Input name="email" type="email" required placeholder="partner@email.com" />
          </Field>
          <Field label="Rola">
            <Select name="role" defaultValue="EDITOR">
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" size="sm">Zaproś</Button>
          </div>
        </form>
        <p className="text-xs text-muted-foreground mt-3">
          Jeśli osoba ma już konto — zostanie dodana od razu. Jeśli nie — otrzymasz link do udostępnienia.
        </p>
      </Card>

      <div className="mt-6 space-y-6">
        {/* Aktywni członkowie */}
        <div>
          <h2 className="text-base font-semibold mb-3">Aktywni członkowie</h2>
          <div className="grid gap-2">
            <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium">Ty (właściciel)</p>
                <p className="text-xs text-muted-foreground">{project.name}</p>
              </div>
              <Badge variant="green">Właściciel</Badge>
            </div>

            {memberList.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground font-mono">
                    {m.user_id.slice(0, 8)}…
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={ROLE_VARIANTS[m.role] ?? "gray"}>
                    {ROLES.find((r) => r.value === m.role)?.label ?? m.role}
                  </Badge>
                  <DeleteButton
                    action={removeMember.bind(null, projectId)}
                    id={m.id}
                    confirmMessage="Usunąć tego członka z projektu?"
                    size="sm"
                  />
                </div>
              </div>
            ))}

            {memberList.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 rounded-md border border-dashed border-border">
                Brak dodatkowych członków
              </p>
            )}
          </div>
        </div>

        {/* Oczekujące zaproszenia */}
        {invitationList.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-3">Oczekujące zaproszenia</h2>
            <div className="grid gap-2">
              {invitationList.map((inv) => {
                const joinUrl = `${baseUrl}/join/${inv.token}`;
                return (
                  <div key={inv.id} className="rounded-md border border-border bg-card px-4 py-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <p className="text-sm font-medium">{inv.email}</p>
                          <Badge variant="gray">
                            {ROLES.find((r) => r.value === inv.role)?.label ?? inv.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground break-all">{joinUrl}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <CopyButton text={joinUrl} label="Kopiuj link" />
                        <DeleteButton
                          action={revokeInvitation.bind(null, projectId)}
                          id={inv.id}
                          confirmMessage={`Cofnąć zaproszenie dla ${inv.email}?`}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
