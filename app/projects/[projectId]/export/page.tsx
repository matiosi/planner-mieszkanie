import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireProject } from "@/lib/data";
import { FileDown, FileSpreadsheet, Image, Package } from "lucide-react";

export default async function ExportPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  await requireProject(projectId);

  const exports = [
    {
      title: "Brief dla projektanta (ZIP)",
      description: "Wszystkie wybrane inspiracje z notatkami, pogrupowane po pomieszczeniach",
      href: `/api/projects/${projectId}/designer-brief/all`,
      icon: Package,
      format: "ZIP",
    },
    {
      title: "Budżet (CSV)",
      description: "Wszystkie pozycje budżetu z planowanymi i rzeczywistymi kosztami",
      href: `/api/projects/${projectId}/export/budget`,
      icon: FileSpreadsheet,
      format: "CSV",
    },
    {
      title: "Zadania (CSV)",
      description: "Lista zadań z terminami i statusami",
      href: `/api/projects/${projectId}/export/tasks`,
      icon: FileSpreadsheet,
      format: "CSV",
    },
    {
      title: "Produkty (CSV)",
      description: "Katalog produktów z cenami i statusami zamówień",
      href: `/api/projects/${projectId}/export/products`,
      icon: FileSpreadsheet,
      format: "CSV",
    },
    {
      title: "Pełny eksport projektu (ZIP)",
      description: "Wszystkie dane w formacie CSV + zdjęcia",
      href: `/api/projects/${projectId}/export/full`,
      icon: Package,
      format: "ZIP",
    },
  ];

  return (
    <>
      <PageHeader
        title="Eksport"
        description="Pobierz dane projektu"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {exports.map((exp) => {
          const Icon = exp.icon;
          return (
            <Card key={exp.href}>
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-muted p-2 shrink-0">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{exp.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{exp.description}</p>
                  <div className="mt-3">
                    <a href={exp.href} download>
                      <Button size="sm" variant="secondary">
                        <FileDown className="h-4 w-4" />
                        Pobierz {exp.format}
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
