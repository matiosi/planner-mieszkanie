"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  // Zamknij po nawigacji
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Zablokuj scroll body gdy drawer otwarty
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Trap focus in the dialog and allow keyboard users to close it.
  useEffect(() => {
    if (!open) return;

    const focusCloseButton = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const selector = 'a[href], button:not([disabled]), select:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>(selector) ?? []);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusCloseButton);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu, open]);

  return (
    <>
      {/* Przycisk hamburgera */}
      <button
        ref={menuButtonRef}
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-accent"
        aria-label="Otwórz menu"
        aria-controls="mobile-navigation"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeMenu}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <aside
        ref={drawerRef}
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Menu główne"
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border bg-background shadow-xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Nagłówek drawera */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4 shrink-0">
          <SidebarLogo />
          <button
            ref={closeButtonRef}
            onClick={closeMenu}
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-accent"
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
      </aside>
    </>
  );
}
