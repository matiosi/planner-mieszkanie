import { AppShell } from "@/components/app-shell";
import Link from "next/link";
import { BookOpen, Store } from "lucide-react";

const tabs = [
  { href: "/library/products", label: "Produkty", icon: BookOpen },
  { href: "/library/stores", label: "Sklepy", icon: Store },
];

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <nav className="flex gap-1 border-b border-border mb-6 -mt-1">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary/50 transition-colors data-[active]:text-foreground data-[active]:border-primary"
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
