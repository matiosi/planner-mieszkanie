import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Sprawdź czy zaproszenie istnieje
  const { data: invitation } = await supabase
    .from("pending_invitations")
    .select("id,email,role,project_id,project:projects(name)")
    .eq("token", token)
    .single();

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold">Link nieważny</h1>
          <p className="text-muted-foreground">
            To zaproszenie wygasło lub zostało cofnięte.
          </p>
          <Button asChild>
            <Link href="/login">Przejdź do logowania</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Sprawdź czy user jest zalogowany
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Zalogowany — sprawdź email i dołącz do projektu
    if (user.email?.toLowerCase() === invitation.email.toLowerCase()) {
      await supabase.from("project_members").insert({
        project_id: invitation.project_id,
        user_id: user.id,
        role: invitation.role,
      }).select().single();

      await supabase.from("pending_invitations").delete().eq("token", token);
      redirect(`/projects/${invitation.project_id}`);
    }
  }

  // Nie zalogowany lub inny email — pokaż stronę zaproszenia
  const projectName = (invitation.project as unknown as { name: string } | null)?.name ?? "projekt";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-2">
            <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Zaproszenie do projektu</h1>
          <p className="text-muted-foreground">
            Zostałeś zaproszony do współpracy nad projektem:
          </p>
          <p className="text-lg font-semibold">&quot;{projectName}&quot;</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-sm space-y-1">
          <p><span className="text-muted-foreground">Email:</span> <strong>{invitation.email}</strong></p>
          <p><span className="text-muted-foreground">Rola:</span> <strong>{invitation.role}</strong></p>
        </div>

        {user ? (
          <div className="space-y-3">
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              Jesteś zalogowany jako <strong>{user.email}</strong>, ale zaproszenie jest dla{" "}
              <strong>{invitation.email}</strong>. Wyloguj się i zaloguj na właściwe konto.
            </div>
            <Button asChild className="w-full" variant="secondary">
              <Link href="/auth/signout">Wyloguj się</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Zaloguj się kontem Google, żeby dołączyć do projektu.
            </p>
            <Button asChild className="w-full">
              <Link href={`/login?next=/join/${token}`}>
                Zaloguj się i dołącz
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
