import { NextRequest, NextResponse } from "next/server";
import { requireProject } from "@/lib/data";
import { labelFor, labels } from "@/lib/labels";

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { supabase } = await requireProject(projectId);

    const { data } = await supabase
      .from("budget_items")
      .select("name,category,planned_cost,actual_cost,status,notes")
      .eq("project_id", projectId)
      .order("category");

    const headers = ["Nazwa", "Kategoria", "Planowany koszt (PLN)", "Rzeczywisty koszt (PLN)", "Status", "Notatki"];
    const rows = (data ?? []).map((r) => [
      r.name,
      labelFor(labels.budgetCategory, r.category),
      r.planned_cost,
      r.actual_cost,
      labelFor(labels.budgetStatus, r.status),
      r.notes,
    ]);

    const csv = toCSV(headers, rows);

    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="budzet.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
