"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold">Wystąpił błąd</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "Coś poszło nie tak. Spróbuj ponownie."}
        </p>
        <Button onClick={reset} className="mt-6">
          Spróbuj ponownie
        </Button>
      </div>
    </div>
  );
}
