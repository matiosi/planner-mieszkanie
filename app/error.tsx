"use client";

import { Button, Card } from "@/components/ui";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <p className="text-sm font-medium text-red-700">Wystąpił błąd</p>
        <h1 className="mt-2 text-2xl font-semibold">Nie udało się wykonać operacji</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "Spróbuj ponownie. Jeśli problem wraca, sprawdź konfigurację Supabase i migracje."}
        </p>
        <div className="mt-6">
          <Button onClick={reset}>Spróbuj ponownie</Button>
        </div>
      </Card>
    </main>
  );
}
