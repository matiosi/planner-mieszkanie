"use client";

import { AppShell } from "@/components/app-shell";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/library/products", label: "Produkty", icon: BookOpen },
  { href: "/library/stores", label: "Sklepy", icon: Store },
];

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AppShell>
      <nav className="flex gap-1 border-b border-border mb-6 -mt-1 overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",
              pathname.startsWith(t.href)
                ? "text-foreground border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground hover:border-primary/50"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </AppShell>
  );
}
