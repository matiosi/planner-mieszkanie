import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav, SidebarLogo } from "@/components/sidebar-nav";

export async function AppShell({
  projectId,
  children,
}: {
  projectId?: string;
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background px-4 md:hidden">
        <SidebarLogo />
      </header>

      <div>
        {/* Sidebar */}
        <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:z-50 md:w-[260px] md:border-r md:border-border md:bg-background">
          <div className="flex h-14 items-center border-b border-border px-4">
            <SidebarLogo />
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-2">
            {projectId ? (
              <SidebarNav projectId={projectId} />
            ) : (
              <div className="px-3 py-8 text-center">
                <p className="text-xs text-muted-foreground">
                  Wybierz projekt, aby zobaczyć nawigację.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-border p-4">
            <div className="mb-2 rounded-md bg-muted px-3 py-2">
              <p className="text-xs text-muted-foreground truncate">
                {user?.email ?? "Nie zalogowano"}
              </p>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Wyloguj się
              </button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <main className="md:ml-[260px] min-h-screen">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
