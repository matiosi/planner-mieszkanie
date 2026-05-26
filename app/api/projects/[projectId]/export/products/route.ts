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

    const [{ data: products }, { data: rooms }] = await Promise.all([
      supabase
        .from("products")
        .select("name,category,price,store,url,status,delivery_status,order_number,room_id,notes")
        .eq("project_id", projectId)
        .order("category")
        .order("name"),
      supabase.from("rooms").select("id,name").eq("project_id", projectId),
    ]);

    const roomMap = Object.fromEntries((rooms ?? []).map((r) => [r.id, r.name]));

    const headers = ["Nazwa", "Kategoria", "Cena (PLN)", "Sklep", "Status", "Dostawa", "Nr zamówienia", "Pomieszczenie", "URL", "Notatki"];
    const rows = (products ?? []).map((p) => [
      p.name,
      p.category,
      p.price,
      p.store,
      labelFor(labels.productStatus, p.status),
      labelFor(labels.deliveryStatus, p.delivery_status),
      p.order_number,
      p.room_id ? roomMap[p.room_id] : "",
      p.url,
      p.notes,
    ]);

    const csv = toCSV(headers, rows);

    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="produkty.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
