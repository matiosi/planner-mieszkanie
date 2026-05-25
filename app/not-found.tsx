import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <div>
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="mt-2 text-2xl font-semibold">Nie znaleziono strony</h1>
        <p className="mt-2 text-sm text-muted-foreground">Ten projekt, widok albo element nie istnieje lub nie masz do niego dostępu.</p>
        <div className="mt-6">
          <LinkButton href="/projects">Wróć do projektów</LinkButton>
        </div>
      </div>
    </main>
  );
}
