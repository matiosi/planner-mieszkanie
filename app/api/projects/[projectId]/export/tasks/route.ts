import { NextRequest, NextResponse } from "next/server";
import { requireProject } from "@/lib/data";
import { labelFor, labels } from "@/lib/labels";
import { formatDate } from "@/lib/formatters";

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

    const [{ data: tasks }, { data: rooms }] = await Promise.all([
      supabase
        .from("tasks")
        .select("title,description,status,priority,due_date,room_id,notes")
        .eq("project_id", projectId)
        .order("status")
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase.from("rooms").select("id,name").eq("project_id", projectId),
    ]);

    const roomMap = Object.fromEntries((rooms ?? []).map((r) => [r.id, r.name]));

    const headers = ["Tytuł", "Opis", "Status", "Priorytet", "Termin", "Pomieszczenie", "Notatki"];
    const rows = (tasks ?? []).map((t) => [
      t.title,
      t.description,
      labelFor(labels.taskStatus, t.status),
      labelFor(labels.priority, t.priority),
      t.due_date ? formatDate(t.due_date) : "",
      t.room_id ? roomMap[t.room_id] : "",
      t.notes,
    ]);

    const csv = toCSV(headers, rows);

    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="zadania.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
