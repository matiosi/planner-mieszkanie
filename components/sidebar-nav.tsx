"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home, Wand2, Sofa, ReceiptText, ListChecks, ShoppingCart, ShoppingBag,
  Truck, Lightbulb, Users, Image, Map, FileText, Shield, Ruler,
  Calculator, Camera, ClipboardCheck, Calendar, CreditCard, TrendingUp,
  MessageSquare, Download, PaintBucket, AlertOctagon, Users2,
  CheckSquare, BookImage,
} from "lucide-react";

const navGroups = [
  {
    label: "Główne",
    items: [
      { label: "Pulpit", href: "", icon: Home },
      { label: "Co teraz?", href: "next-actions", icon: Wand2 },
    ],
  },
  {
    label: "Projekt",
    items: [
      { label: "Pomieszczenia", href: "rooms", icon: Sofa },
      { label: "Budżet", href: "budget", icon: ReceiptText },
      { label: "Ograniczenia", href: "constraints", icon: AlertOctagon },
      { label: "Zadania", href: "tasks", icon: ListChecks },
      { label: "Produkty", href: "products", icon: ShoppingBag },
    ],
  },
  {
    label: "Zakupy",
    items: [
      { label: "Lista zakupów", href: "shopping-list", icon: ShoppingCart },
      { label: "Dostawy", href: "deliveries", icon: Truck },
      { label: "Decyzje", href: "decisions", icon: Lightbulb },
    ],
  },
  {
    label: "Realizacja",
    items: [
      { label: "Wykonawcy", href: "vendors", icon: Users },
      { label: "Inspiracje", href: "inspirations", icon: Image },
      { label: "Pinterest", href: "inspirations/pinterest", icon: BookImage },
      { label: "Plany", href: "plans", icon: Map },
      { label: "Dokumenty", href: "documents", icon: FileText },
      { label: "Gwarancje", href: "warranties", icon: Shield },
      { label: "Checklistry", href: "checklist", icon: CheckSquare },
    ],
  },
  {
    label: "Technikalia",
    items: [
      { label: "Pomiary", href: "measurements", icon: Ruler },
      { label: "Kalkulatory", href: "calculators", icon: Calculator },
      { label: "Postęp prac", href: "progress", icon: Camera },
      { label: "Odbiór prac", href: "punch-list", icon: ClipboardCheck },
    ],
  },
  {
    label: "Finanse",
    items: [
      { label: "Harmonogram", href: "schedule", icon: Calendar },
      { label: "Płatności", href: "payments", icon: CreditCard },
      { label: "Cashflow", href: "cashflow", icon: TrendingUp },
    ],
  },
  {
    label: "Inne",
    items: [
      { label: "Pytania", href: "questions", icon: MessageSquare },
      { label: "Członkowie", href: "members", icon: Users2 },
      { label: "Eksport", href: "export", icon: Download },
    ],
  },
];

export function SidebarNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  function isActive(href: string) {
    const base = `/projects/${projectId}`;
    if (href === "") return pathname === base;
    return pathname.startsWith(`${base}/${href}`);
  }

  return (
    <nav className="space-y-4">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </p>
          <div className="grid gap-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const href = item.href
                ? `/projects/${projectId}/${item.href}`
                : `/projects/${projectId}`;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    active && "bg-accent font-medium text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function SidebarLogo() {
  return (
    <Link href="/projects" className="flex items-center gap-2 font-semibold">
      <PaintBucket className="h-5 w-5 text-primary shrink-0" />
      <span className="truncate">Planner Mieszkanie</span>
    </Link>
  );
}
