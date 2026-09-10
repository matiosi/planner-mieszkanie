import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { requireUser, signedUrl } from "@/lib/data";
import { ProjectDesignerBriefPDF, type ProjectBriefSection } from "@/components/project-designer-brief-pdf";
import React from "react";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    await requireUser();

    const [
      { data: project },
      { data: rooms },
      { data: inspirations },
      { data: briefNotes },
      { data: constraints },
      { data: surveyScans },
    ] = await Promise.all([
      supabase.from("projects").select("name,style,area,description").eq("id", projectId).single(),
      supabase.from("rooms").select("id,name,area,concept_description").eq("project_id", projectId).order("sort_order"),
      supabase
        .from("inspirations")
        .select("id,title,source,category,description,designer_note,external_url,storage_bucket,storage_path,room_id")
        .eq("project_id", projectId)
        .eq("selected_for_designer", true),
      supabase.from("designer_brief_room_notes").select("room_id,note").eq("project_id", projectId),
      supabase.from("project_constraints").select("room_id,description").eq("project_id", projectId),
      supabase
        .from("survey_scans")
        .select("id,title,room_id,storage_bucket,storage_path")
        .eq("project_id", projectId)
        .order("created_at"),
    ]);

    if (!project) return NextResponse.json({ error: "Projekt nie istnieje" }, { status: 404 });

    const roomList = rooms ?? [];
    const roomNames = new Map(roomList.map((room) => [room.id, room.name]));
    const noteMap = new Map((briefNotes ?? []).map((note) => [note.room_id, note.note ?? null]));
    const constraintsByRoom = new Map<string | null, string[]>();
    for (const constraint of constraints ?? []) {
      const key = constraint.room_id ?? null;
      constraintsByRoom.set(key, [...(constraintsByRoom.get(key) ?? []), constraint.description]);
    }

    const inspirationWithImages = await Promise.all(
      (inspirations ?? []).map(async (inspiration) => ({
        ...inspiration,
        imageUrl: inspiration.source === "UPLOAD" && inspiration.storage_bucket && inspiration.storage_path
          ? await signedUrl(inspiration.storage_bucket, inspiration.storage_path)
          : inspiration.external_url,
      }))
    );

    const sections: ProjectBriefSection[] = roomList.map((room) => ({
      id: room.id,
      name: room.name,
      area: room.area,
      concept: room.concept_description,
      note: noteMap.get(room.id) ?? null,
      constraints: [
        ...(constraintsByRoom.get(null) ?? []),
        ...(constraintsByRoom.get(room.id) ?? []),
      ],
      inspirations: inspirationWithImages
        .filter((inspiration) => inspiration.room_id === room.id)
        .map((inspiration) => ({
          id: inspiration.id,
          title: inspiration.title,
          category: inspiration.category,
          description: inspiration.description,
          designerNote: inspiration.designer_note,
          imageUrl: inspiration.imageUrl,
        })),
    }));

    const unassignedInspirations = inspirationWithImages
      .filter((inspiration) => !inspiration.room_id)
      .map((inspiration) => ({
        id: inspiration.id,
        title: inspiration.title,
        category: inspiration.category,
        description: inspiration.description,
        designerNote: inspiration.designer_note,
        imageUrl: inspiration.imageUrl,
      }));
    if (unassignedInspirations.length) {
      sections.push({
        id: "general-inspirations",
        name: "Inspiracje ogólne",
        area: null,
        concept: null,
        note: null,
        constraints: constraintsByRoom.get(null) ?? [],
        inspirations: unassignedInspirations,
      });
    }

    const scansWithImages = await Promise.all(
      (surveyScans ?? []).map(async (scan) => ({
        id: scan.id,
        title: scan.title,
        roomName: scan.room_id ? roomNames.get(scan.room_id) ?? null : null,
        imageUrl: await signedUrl(scan.storage_bucket, scan.storage_path),
      }))
    );
    const generatedAt = new Date().toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const buffer = await renderToBuffer(
      <ProjectDesignerBriefPDF
        project={project}
        surveyScans={scansWithImages}
        sections={sections}
        generatedAt={generatedAt}
      />
    );
    const safeName = project.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="brief-projektanta-${safeName || "projekt"}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Project brief PDF error:", error);
    return NextResponse.json({ error: "Nie udało się wygenerować PDF briefu" }, { status: 500 });
  }
}
