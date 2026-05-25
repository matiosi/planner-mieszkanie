import { Card } from "@/components/ui";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm text-center">
        <p className="font-medium">Ładowanie...</p>
        <p className="mt-1 text-sm text-muted-foreground">Przygotowujemy dane projektu.</p>
      </Card>
    </main>
  );
}
