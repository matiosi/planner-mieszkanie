import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <p className="mt-4 text-xl font-semibold">Strona nie istnieje</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Nie znaleziono szukanej strony lub zasobu.
        </p>
        <Button asChild className="mt-6">
          <Link href="/projects">Wróć do projektów</Link>
        </Button>
      </div>
    </div>
  );
}
