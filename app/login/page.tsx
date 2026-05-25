import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PaintBucket } from "lucide-react";
import { loginWithGoogle } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/projects");

  const params = await searchParams;
  const oauthError = params.error === "oauth" ? "Błąd logowania. Spróbuj ponownie." : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-3">
            <PaintBucket className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Planner Mieszkanie</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Zaloguj się, aby zarządzać swoim projektem wykończenia.
          </p>
        </div>

        {oauthError && (
          <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            {oauthError}
          </div>
        )}

        <form action={loginWithGoogle} className="mt-8">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-muted transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Zaloguj się przez Google
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Logując się, akceptujesz politykę prywatności i warunki korzystania z serwisu.
        </p>
      </div>
    </div>
  );
}
