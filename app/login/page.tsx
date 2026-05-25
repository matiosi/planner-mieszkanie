import { Card } from "@/components/ui";
import { GoogleLoginButton } from "@/components/auth-buttons";
import { hasSupabaseEnv } from "@/lib/env";

export default function LoginPage() {
  const isConfigured = hasSupabaseEnv();

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <p className="text-sm font-medium text-primary">FlatFinish Planner</p>
        <h1 className="mt-2 text-2xl font-semibold">Zaloguj się</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Użyj konta Google, aby zarządzać projektem wykończenia mieszkania.
        </p>
        {isConfigured ? (
          <div className="mt-6">
            <GoogleLoginButton />
          </div>
        ) : (
          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Uzupełnij zmienne Supabase w pliku <code>.env</code>, aby włączyć logowanie.
          </div>
        )}
      </Card>
    </main>
  );
}
