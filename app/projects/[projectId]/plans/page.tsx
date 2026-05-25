import { uploadPlan } from "@/app/actions";
import { Badge, Button, Card, Field, LinkButton, PageHeader, inputClass } from "@/components/ui";
import { labelFor, labels } from "@/lib/labels";
import { requireProject, signedUrl } from "@/lib/data";

export default async function PlansPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);
  const { data } = await supabase.from("project_plans").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
  const plans = await Promise.all((data ?? []).map(async (plan) => ({ ...plan, signedUrl: await signedUrl(plan.storage_bucket, plan.storage_path) })));

  return (
    <>
      <PageHeader
        title="Plany"
        description="Prześlij plan pierwotny i plan projektanta jako obraz JPEG, PNG albo WebP."
        actions={<LinkButton href={`/projects/${projectId}/plans/compare`} variant="secondary">Porównaj plany</LinkButton>}
      />
      <Card className="mt-6">
        <form action={uploadPlan.bind(null, projectId)} className="grid gap-3 md:grid-cols-5">
          <Field label="Typ"><select className={inputClass} name="plan_type"><option value="ORIGINAL">Plan pierwotny</option><option value="DESIGNER">Plan projektanta</option></select></Field>
          <Field label="Tytuł"><input className={inputClass} name="title" /></Field>
          <Field label="Wersja"><input className={inputClass} name="version_label" placeholder="v1, v2, final" /></Field>
          <Field label="Plik"><input className={inputClass} name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></Field>
          <div className="flex items-end"><Button className="w-full">Prześlij</Button></div>
        </form>
      </Card>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id}>
            {plan.signedUrl ? <img src={plan.signedUrl} alt="" className="mb-4 aspect-video w-full rounded-md object-contain bg-muted" /> : null}
            <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{plan.title}</h2><Badge>{labelFor(labels.planType, plan.plan_type)}</Badge></div>
            <p className="mt-1 text-sm text-muted-foreground">{plan.version_label || "Bez wersji"} · {plan.original_file_name}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
