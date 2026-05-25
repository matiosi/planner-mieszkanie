import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser, signedUrl } from "@/lib/data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; roomId: string }> }
) {
  try {
    const { projectId, roomId } = await params;
    const supabase = await createClient();
    await requireUser();

    const [
      { data: room },
      { data: inspirations },
      { data: briefNote },
      { data: project },
      { data: constraints },
    ] = await Promise.all([
      supabase
        .from("rooms")
        .select("id,name,area,concept_description,notes")
        .eq("id", roomId)
        .single(),
      supabase
        .from("inspirations")
        .select("id,title,source,category,external_url,storage_bucket,storage_path,designer_note")
        .eq("project_id", projectId)
        .eq("room_id", roomId)
        .eq("selected_for_designer", true),
      supabase
        .from("designer_brief_room_notes")
        .select("note")
        .eq("project_id", projectId)
        .eq("room_id", roomId)
        .maybeSingle(),
      supabase
        .from("projects")
        .select("name,style,area,description")
        .eq("id", projectId)
        .single(),
      supabase
        .from("project_constraints")
        .select("type,description")
        .eq("project_id", projectId)
        .eq("room_id", roomId),
    ]);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Resolve image URLs
    const imageMap: Record<string, string | null> = {};
    for (const insp of inspirations ?? []) {
      if (insp.source === "UPLOAD" && insp.storage_bucket && insp.storage_path) {
        imageMap[insp.id] = await signedUrl(insp.storage_bucket, insp.storage_path);
      } else {
        imageMap[insp.id] = insp.external_url;
      }
    }

    // Build a plain text PDF-like response for now
    // (Full @react-pdf/renderer integration requires server-side rendering)
    const projectData = project ?? { name: "Projekt", style: null, area: null, description: null };
    let content = `BRIEF DLA PROJEKTANTA\n`;
    content += `=====================\n\n`;
    content += `Projekt: ${projectData.name}\n`;
    if (projectData.style) content += `Styl: ${projectData.style}\n`;
    content += `\n`;
    content += `Pomieszczenie: ${room.name}\n`;
    if (room.area) content += `Powierzchnia: ${room.area} m²\n`;
    if (room.concept_description) content += `\nKoncepcja:\n${room.concept_description}\n`;
    if (briefNote?.note) content += `\nNotatka:\n${briefNote.note}\n`;
    if ((constraints ?? []).length > 0) {
      content += `\nWymagania:\n`;
      for (const c of constraints ?? []) {
        content += `• ${c.description}\n`;
      }
    }
    content += `\nInspirations (${(inspirations ?? []).length}):\n`;
    for (const insp of inspirations ?? []) {
      content += `\n- ${insp.title}`;
      if (insp.category) content += ` [${insp.category}]`;
      if (insp.designer_note) content += `\n  Notatka: "${insp.designer_note}"`;
      if (insp.external_url) content += `\n  Link: ${insp.external_url}`;
      content += "\n";
    }

    const safeName = room.name.replace(/[^a-zA-Z0-9\s]/g, "_");
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="brief-${safeName}.txt"`,
      },
    });
  } catch (err) {
    console.error("Brief generation error:", err);
    return NextResponse.json({ error: "Nie udało się wygenerować briefu" }, { status: 500 });
  }
}
