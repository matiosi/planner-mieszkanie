import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PaintBucket } from "lucide-react";
import { GoogleLoginButton } from "@/components/google-login-button";

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

        <div className="mt-8">
          <GoogleLoginButton />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Logując się, akceptujesz politykę prywatności i warunki korzystania z serwisu.
        </p>
      </div>
    </div>
  );
}
