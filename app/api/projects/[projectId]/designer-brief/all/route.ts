import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser, signedUrl } from "@/lib/data";
import JSZip from "jszip";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    await requireUser();

    const [{ data: rooms }, { data: inspirations }, { data: briefNotes }, { data: project }] =
      await Promise.all([
        supabase
          .from("rooms")
          .select("id,name,area,concept_description")
          .eq("project_id", projectId)
          .order("sort_order"),
        supabase
          .from("inspirations")
          .select(
            "id,title,source,category,external_url,storage_bucket,storage_path,designer_note,room_id"
          )
          .eq("project_id", projectId)
          .eq("selected_for_designer", true),
        supabase
          .from("designer_brief_room_notes")
          .select("room_id,note")
          .eq("project_id", projectId),
        supabase
          .from("projects")
          .select("name,style,area,description")
          .eq("id", projectId)
          .single(),
      ]);

    const zip = new JSZip();

    const noteMap = Object.fromEntries(
      (briefNotes ?? []).map((n) => [n.room_id, n.note ?? ""])
    );

    // Add a README
    const projectData = project ?? { name: "Projekt", style: "", area: null, description: "" };
    let readme = `BRIEF DLA PROJEKTANTA\n`;
    readme += `=====================\n\n`;
    readme += `Projekt: ${projectData.name}\n`;
    if (projectData.style) readme += `Styl: ${projectData.style}\n`;
    if (projectData.area) readme += `Powierzchnia: ${projectData.area} m²\n`;
    if (projectData.description) readme += `Opis: ${projectData.description}\n`;
    readme += `\n`;

    for (const room of rooms ?? []) {
      const roomInsps = (inspirations ?? []).filter((i) => i.room_id === room.id);
      if (!roomInsps.length) continue;

      const roomFolder = zip.folder(room.name.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]/g, "_") ?? "pokoj");
      if (!roomFolder) continue;

      // Room info text
      let roomInfo = `${room.name}\n`;
      if (room.area) roomInfo += `Powierzchnia: ${room.area} m²\n`;
      if (room.concept_description) roomInfo += `Koncepcja: ${room.concept_description}\n`;
      if (noteMap[room.id]) roomInfo += `\nNotatka dla projektanta:\n${noteMap[room.id]}\n`;
      roomInfo += `\nInspirations:\n`;

      for (const insp of roomInsps) {
        roomInfo += `- ${insp.title}`;
        if (insp.category) roomInfo += ` [${insp.category}]`;
        if (insp.designer_note) roomInfo += `\n  Notatka: ${insp.designer_note}`;
        if (insp.external_url) roomInfo += `\n  Link: ${insp.external_url}`;
        roomInfo += "\n";

        // Download and add image if UPLOAD
        if (insp.source === "UPLOAD" && insp.storage_bucket && insp.storage_path) {
          try {
            const url = await signedUrl(insp.storage_bucket, insp.storage_path);
            if (url) {
              const res = await fetch(url);
              if (res.ok) {
                const ext = insp.storage_path.split(".").pop() ?? "jpg";
                const safeName = insp.title.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]/g, "_");
                roomFolder.file(`${safeName}.${ext}`, await res.arrayBuffer());
              }
            }
          } catch {
            // Skip failed image downloads
          }
        }
      }

      roomFolder.file("info.txt", roomInfo);
      readme += `[${room.name}] — ${roomInsps.length} inspiracji\n`;
    }

    zip.file("README.txt", readme);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="brief-projektanta.zip"`,
      },
    });
  } catch (err) {
    console.error("Brief ZIP error:", err);
    return NextResponse.json({ error: "Nie udało się wygenerować briefu" }, { status: 500 });
  }
}
