import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireProject } from "@/lib/data";
import { formatCurrency } from "@/lib/formatters";

export default async function BudgetScenariosPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  await requireProject(projectId);

  return (
    <>
      <PageHeader title="Warianty budżetu" description="Porównaj scenariusze kosztów projektu." />
      <EmptyState
        title="Warianty budżetu"
        description="Moduł wariantów budżetu będzie dostępny wkrótce."
        className="mt-6"
      />
    </>
  );
}
