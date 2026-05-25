import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DeleteButton } from "@/components/delete-button";
import { labelFor, labels } from "@/lib/labels";
import { formatDate } from "@/lib/formatters";
import { requireProject, signedUrl } from "@/lib/data";
import { uploadPlan, deletePlan } from "@/app/actions/plans";
import { Plus, GitCompare } from "lucide-react";

export default async function PlansPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const { data: plans } = await supabase
    .from("project_plans")
    .select("id,plan_type,title,version_label,is_current,mime_type,original_file_name,storage_bucket,storage_path,created_at")
    .eq("project_id", projectId)
    .order("plan_type")
    .order("created_at", { ascending: false });

  const list = plans ?? [];

  // Generuj signed URLs
  const withUrls = await Promise.all(
    list.map(async (p) => ({
      ...p,
      url: await signedUrl(p.storage_bucket, p.storage_path),
    }))
  );

  const originalPlans = withUrls.filter((p) => p.plan_type === "ORIGINAL");
  const designerPlans = withUrls.filter((p) => p.plan_type === "DESIGNER");

  async function addPlan(formData: FormData) {
    "use server";
    await uploadPlan(projectId, formData);
  }

  return (
    <>
      <PageHeader
        title="Plany"
        description="Zarządzaj planami mieszkania."
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={`/projects/${projectId}/plans/compare`}>
              <GitCompare className="h-4 w-4" />
              Porównaj plany
            </Link>
          </Button>
        }
      />

      {/* Upload */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Wgraj plan</h2>
        <form action={addPlan} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" encType="multipart/form-data">
          <Field label="Typ planu">
            <Select name="plan_type" defaultValue="ORIGINAL">
              <option value="ORIGINAL">Plan pierwotny</option>
              <option value="DESIGNER">Plan projektanta</option>
            </Select>
          </Field>
          <Field label="Tytuł">
            <Input name="title" placeholder="np. Plan po zmianach v2" />
          </Field>
          <Field label="Wersja">
            <Input name="version_label" placeholder="np. v1, final" />
          </Field>
          <Field label="Plik (JPEG, PNG, WebP) *">
            <Input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Wgraj plan
            </Button>
          </div>
        </form>
      </Card>

      {/* Plany */}
      {!list.length ? (
        <EmptyState title="Brak planów" description="Wgraj pierwszy plan powyżej." className="mt-6" />
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {[
            { label: "Plan pierwotny", items: originalPlans },
            { label: "Plany projektanta", items: designerPlans },
          ].map(({ label, items }) => (
            <div key={label}>
              <h2 className="font-semibold mb-3">{label}</h2>
              {!items.length ? (
                <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Brak {label.toLowerCase()}
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((plan) => (
                    <Card key={plan.id} className="flex gap-4">
                      {plan.url && (
                        <img
                          src={plan.url}
                          alt={plan.title}
                          className="h-24 w-24 shrink-0 rounded-md object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{plan.title}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {plan.version_label && (
                            <span className="text-xs bg-muted rounded px-1.5 py-0.5">{plan.version_label}</span>
                          )}
                          {plan.is_current && (
                            <span className="text-xs bg-green-100 text-green-700 rounded px-1.5 py-0.5">Bieżący</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(plan.created_at)}</p>
                        <div className="flex gap-2 mt-2">
                          {plan.url && (
                            <a href={plan.url} target="_blank" rel="noopener noreferrer">
                              <Button variant="secondary" size="sm" className="text-xs">Podgląd</Button>
                            </a>
                          )}
                          <DeleteButton
                            action={deletePlan.bind(null, projectId)}
                            id={plan.id}
                            confirmMessage={`Usuń plan "${plan.title}"?`}
                            size="sm"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
