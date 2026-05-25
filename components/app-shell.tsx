import Link from "next/link";
import { Home, ListChecks, PaintBucket, ReceiptText, Sofa, Sparkles, Store, Users, Wand2, Image, Map } from "lucide-react";
import { SignOutButton } from "@/components/auth-buttons";
import { navLabels } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { label: navLabels.dashboard, href: "", icon: Home },
  { label: navLabels.nextActions, href: "next-actions", icon: Wand2 },
  { label: navLabels.rooms, href: "rooms", icon: Sofa },
  { label: navLabels.budget, href: "budget", icon: ReceiptText },
  { label: navLabels.tasks, href: "tasks", icon: ListChecks },
  { label: navLabels.products, href: "products", icon: Store },
  { label: navLabels.decisions, href: "decisions", icon: Sparkles },
  { label: navLabels.vendors, href: "vendors", icon: Users },
  { label: navLabels.inspirations, href: "inspirations", icon: Image },
  { label: navLabels.plans, href: "plans", icon: Map }
];

export async function AppShell({
  projectId,
  children
}: {
  projectId?: string;
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="border-b border-border bg-white p-4 md:min-h-screen md:border-b-0 md:border-r">
        <Link href="/projects" className="flex items-center gap-2 font-semibold">
          <PaintBucket className="h-5 w-5 text-primary" />
          FlatFinish Planner
        </Link>
        <div className="mt-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          {user?.email ?? "Nie zalogowano"}
        </div>
        {projectId ? (
          <nav className="mt-5 grid gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const href = item.href ? `/projects/${projectId}/${item.href}` : `/projects/${projectId}`;
              return (
                <Link key={item.href} href={href} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
        <div className="mt-5">
          <SignOutButton />
        </div>
      </aside>
      <main className="p-4 md:p-8">{children}</main>
    </div>
  );
}
