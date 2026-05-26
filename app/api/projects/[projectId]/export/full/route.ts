import { NextRequest, NextResponse } from "next/server";
import { requireProject } from "@/lib/data";
import JSZip from "jszip";

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows.map((r) => headers.map((h) => escape(r[h])))].map((r) => r.join(",")).join("\n");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { supabase } = await requireProject(projectId);

    const [{ data: budget }, { data: tasks }, { data: products }, { data: payments }, { data: vendors }] =
      await Promise.all([
        supabase.from("budget_items").select("name,category,planned_cost,actual_cost,status,notes").eq("project_id", projectId),
        supabase.from("tasks").select("title,description,status,priority,due_date,notes").eq("project_id", projectId),
        supabase.from("products").select("name,category,price,store,url,status,delivery_status,order_number,notes").eq("project_id", projectId),
        supabase.from("payments").select("title,amount,status,planned_date,paid_date,payment_method").eq("project_id", projectId),
        supabase.from("vendors").select("name,type,status,phone,email,notes").eq("project_id", projectId),
      ]);

    const zip = new JSZip();
    if (budget?.length) zip.file("budzet.csv", toCSV(budget as Record<string, unknown>[]));
    if (tasks?.length) zip.file("zadania.csv", toCSV(tasks as Record<string, unknown>[]));
    if (products?.length) zip.file("produkty.csv", toCSV(products as Record<string, unknown>[]));
    if (payments?.length) zip.file("platnosci.csv", toCSV(payments as Record<string, unknown>[]));
    if (vendors?.length) zip.file("wykonawcy.csv", toCSV(vendors as Record<string, unknown>[]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="projekt-pelny-eksport.zip"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
