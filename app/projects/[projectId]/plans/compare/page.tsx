import { deleteRow, upsertPlanDifference } from "@/app/actions";
import { PlanComparison } from "@/components/plan-comparison";
import { Badge, Button, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { requireProject, signedUrl } from "@/lib/data";
import { labelFor, labels } from "@/lib/labels";

export default async function ComparePlansPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);
  const [plans, rooms, differences] = await Promise.all([
    supabase.from("project_plans").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("name"),
    supabase.from("plan_differences").select("*, rooms(name)").eq("project_id", projectId).order("created_at", { ascending: false })
  ]);
  const original = plans.data?.find((plan) => plan.plan_type === "ORIGINAL");
  const designer = plans.data?.find((plan) => plan.plan_type === "DESIGNER");

  return (
    <>
      <PageHeader title="Porównanie planów" description="Widok 50/50 z przybliżaniem, przesuwaniem i ręcznymi notatkami różnic." />
      <div className="mt-6">
        <PlanComparison
          originalUrl={await signedUrl(original?.storage_bucket, original?.storage_path)}
          designerUrl={await signedUrl(designer?.storage_bucket, designer?.storage_path)}
        />
      </div>
      <Card className="mt-6">
        <form action={upsertPlanDifference.bind(null, projectId)} className="grid gap-3 md:grid-cols-6">
          <Field label="Tytuł"><input className={inputClass} name="title" required /></Field>
          <Field label="Pokój"><select className={inputClass} name="room_id"><option value="">Cały projekt</option>{rooms.data?.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></Field>
          <Field label="Status"><select className={inputClass} name="status">{Object.entries(labels.planDifferenceStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="Priorytet"><select className={inputClass} name="priority"><option value="LOW">Niska</option><option value="MEDIUM">Średnia</option><option value="HIGH">Wysoka</option></select></Field>
          <Field label="Opis"><input className={inputClass} name="description" /></Field>
          <div className="flex items-end"><Button className="w-full">Dodaj</Button></div>
        </form>
      </Card>
      <div className="mt-6 grid gap-3">
        {differences.data?.map((item) => (
          <Card key={item.id} className="grid gap-3 md:grid-cols-[1fr_150px_120px_90px] md:items-center">
            <div><h2 className="font-medium">{item.title}</h2><p className="text-sm text-muted-foreground">{item.rooms?.name ?? "Cały projekt"} · {item.description}</p></div>
            <Badge>{labelFor(labels.planDifferenceStatus, item.status)}</Badge>
            <Badge>{item.priority}</Badge>
            <form action={deleteRow.bind(null, projectId, "plan_differences", "/plans/compare")}><input type="hidden" name="id" value={item.id} /><Button variant="danger">Usuń</Button></form>
          </Card>
        ))}
      </div>
    </>
  );
}
