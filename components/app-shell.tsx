import { LogOut } from "lucide-react";
import { requireUser } from "@/lib/data";
import { SidebarNav, SidebarLogo } from "@/components/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileSidebar } from "@/components/mobile-sidebar";

export async function AppShell({
  projectId,
  children,
}: {
  projectId?: string;
  children: React.ReactNode;
}) {
  const { user } = await requireUser();

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[60] rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Przejdź do treści
      </a>
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
        <SidebarLogo />
        <MobileSidebar projectId={projectId} userEmail={user?.email} />
      </header>

      <div>
        {/* Desktop Sidebar */}
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

          <div className="border-t border-border p-4 space-y-1">
            <div className="mb-2 rounded-md bg-muted px-3 py-2">
              <p className="text-xs text-muted-foreground truncate">
                {user?.email ?? "Nie zalogowano"}
              </p>
            </div>
            <ThemeToggle />
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
        <main id="main-content" tabIndex={-1} className="min-h-screen focus:outline-none md:ml-[260px]">
          <div className="mx-auto w-full max-w-[1440px] p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
