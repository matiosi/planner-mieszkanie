import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DeleteButton } from "@/components/delete-button";
import { PlanComparison } from "@/components/plan-comparison";
import { labelFor, labels, statusVariant } from "@/lib/labels";
import { requireProject, signedUrl } from "@/lib/data";
import { upsertPlanDifference, deletePlanDifference } from "@/app/actions/plans";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function PlanComparePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: plans }, { data: differences }, { data: rooms }] = await Promise.all([
    supabase
      .from("project_plans")
      .select("id,plan_type,storage_bucket,storage_path,is_current,version_label")
      .eq("project_id", projectId),
    supabase
      .from("plan_differences")
      .select("id,title,description,status,priority,room_id")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
  ]);

  const planList = plans ?? [];
  const diffList = differences ?? [];
  const roomList = rooms ?? [];

  const originalPlan = planList.find((p) => p.plan_type === "ORIGINAL" && p.is_current)
    ?? planList.find((p) => p.plan_type === "ORIGINAL");
  const designerPlan = planList.find((p) => p.plan_type === "DESIGNER" && p.is_current)
    ?? planList.find((p) => p.plan_type === "DESIGNER");

  const [originalUrl, designerUrl] = await Promise.all([
    signedUrl(originalPlan?.storage_bucket, originalPlan?.storage_path),
    signedUrl(designerPlan?.storage_bucket, designerPlan?.storage_path),
  ]);

  async function addDifference(formData: FormData) {
    "use server";
    await upsertPlanDifference(projectId, formData);
  }

  return (
    <>
      <PageHeader
        title="Porównanie planów"
        description="Oceń różnice między planem pierwotnym a projektem."
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={`/projects/${projectId}/plans`}>← Plany</Link>
          </Button>
        }
      />

      {/* Split view */}
      <div className="mt-6">
        <PlanComparison originalUrl={originalUrl} designerUrl={designerUrl} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Lista różnic */}
        <Card>
          <h2 className="font-semibold mb-4">
            Różnice ({diffList.filter((d) => d.status === "NEEDS_DISCUSSION").length} do omówienia)
          </h2>
          {!diffList.length ? (
            <p className="text-sm text-muted-foreground">Brak zidentyfikowanych różnic.</p>
          ) : (
            <div className="space-y-3">
              {diffList.map((diff) => {
                const roomName = roomList.find((r) => r.id === diff.room_id)?.name;
                return (
                  <div key={diff.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{diff.title}</p>
                      <Badge variant={statusVariant(diff.status)}>
                        {labelFor(labels.planDifferenceStatus, diff.status)}
                      </Badge>
                    </div>
                    {diff.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{diff.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant={statusVariant(diff.priority)}>
                        {labelFor(labels.priority, diff.priority)}
                      </Badge>
                      {roomName && <Badge variant="gray">{roomName}</Badge>}
                    </div>
                    <div className="mt-2">
                      <DeleteButton
                        action={deletePlanDifference.bind(null, projectId)}
                        id={diff.id}
                        confirmMessage={`Usuń różnicę "${diff.title}"?`}
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Formularz dodawania */}
        <Card>
          <h2 className="font-semibold mb-4">Dodaj różnicę</h2>
          <form action={addDifference} className="grid gap-3">
            <Field label="Tytuł *">
              <Input name="title" required placeholder="np. Przesunięcie ściany w salonie" />
            </Field>
            <Field label="Opis">
              <Textarea name="description" rows={2} placeholder="Szczegóły różnicy…" />
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue="NEEDS_DISCUSSION">
                {Object.entries(labels.planDifferenceStatus).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </Field>
            <Field label="Priorytet">
              <Select name="priority" defaultValue="MEDIUM">
                <option value="LOW">Niska</option>
                <option value="MEDIUM">Średnia</option>
                <option value="HIGH">Wysoka</option>
              </Select>
            </Field>
            <Field label="Pomieszczenie">
              <Select name="room_id" defaultValue="">
                <option value="">— brak —</option>
                {roomList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            </Field>
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Dodaj różnicę
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
