import { PageHeader } from "@/components/ui/page-header";
import { FlooringCalculator } from "@/components/calculators/flooring-calculator";
import { PaintCalculator } from "@/components/calculators/paint-calculator";
import { TilesCalculator } from "@/components/calculators/tiles-calculator";

export default async function CalculatorsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <>
      <PageHeader
        title="Kalkulatory"
        description="Oblicz zużycie materiałów budowlanych"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <FlooringCalculator projectId={projectId} />
        <PaintCalculator projectId={projectId} />
        <TilesCalculator projectId={projectId} />
      </div>
    </>
  );
}
