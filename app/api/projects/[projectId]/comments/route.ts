import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const COMMENT_ENTITY_TYPES = new Set(["project", "task", "decision", "product", "plan", "punch_list_item", "room", "vendor"]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType") ?? "";
  const entityId = searchParams.get("entityId") ?? "";
  if (!COMMENT_ENTITY_TYPES.has(entityType) || !entityId) {
    return NextResponse.json([], { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const { data } = await supabase
    .from("comments")
    .select("id,body,created_by,created_at")
    .eq("project_id", projectId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at");

  return NextResponse.json(data ?? []);
}
