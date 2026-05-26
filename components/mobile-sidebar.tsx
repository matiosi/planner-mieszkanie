"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { SidebarNav, SidebarLogo } from "@/components/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";

interface Props {
  projectId?: string;
  userEmail?: string;
}

export function MobileSidebar({ projectId, userEmail }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Zamknij po nawigacji
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Zablokuj scroll body gdy drawer otwarty
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Przycisk hamburgera */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-accent transition-colors"
        aria-label="Otwórz menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] bg-background border-r border-border shadow-xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Nagłówek drawera */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4 shrink-0">
          <SidebarLogo />
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent transition-colors"
            aria-label="Zamknij menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nawigacja */}
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

        {/* Stopka drawera */}
        <div className="border-t border-border p-4 space-y-1 shrink-0">
          {userEmail && (
            <div className="mb-2 rounded-md bg-muted px-3 py-2">
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          )}
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
      </div>
    </>
  );
}
