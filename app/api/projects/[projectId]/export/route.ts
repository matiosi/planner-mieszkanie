import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/data";
import JSZip from "jszip";

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = String(val);
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",")
    ),
  ];
  return lines.join("\n");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    await requireUser();

    const zip = new JSZip();

    const [{ data: budget }, { data: tasks }, { data: products }, { data: payments }] =
      await Promise.all([
        supabase
          .from("budget_items")
          .select("id,name,category,planned_cost,actual_cost,status,notes")
          .eq("project_id", projectId),
        supabase
          .from("tasks")
          .select("id,title,description,status,priority,due_date")
          .eq("project_id", projectId),
        supabase
          .from("products")
          .select("id,name,category,price,store,url,status,delivery_status,order_number")
          .eq("project_id", projectId),
        supabase
          .from("payments")
          .select("id,title,amount,status,planned_date,paid_date,payment_method")
          .eq("project_id", projectId),
      ]);

    if (budget?.length) zip.file("budget.csv", toCSV(budget as Record<string, unknown>[]));
    if (tasks?.length) zip.file("tasks.csv", toCSV(tasks as Record<string, unknown>[]));
    if (products?.length) zip.file("products.csv", toCSV(products as Record<string, unknown>[]));
    if (payments?.length) zip.file("payments.csv", toCSV(payments as Record<string, unknown>[]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="projekt-eksport.zip"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
