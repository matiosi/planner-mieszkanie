import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { NewProjectForm } from "@/components/forms/new-project-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  return (
    <AppShell>
      <PageHeader
        title="Nowy projekt"
        description="Podaj podstawowe dane swojego mieszkania."
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/projects"><ArrowLeft className="h-4 w-4" /> Wróć</Link>
          </Button>
        }
      />
      <NewProjectForm />
    </AppShell>
  );
}
