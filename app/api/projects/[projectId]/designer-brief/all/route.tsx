import JSZip from "jszip";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { requireProject, signedUrl } from "@/lib/data";
import { slugify } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: "#1f2937" },
  title: { fontSize: 22, marginBottom: 8, fontWeight: 700 },
  subtitle: { fontSize: 14, marginTop: 16, marginBottom: 8, fontWeight: 700 },
  card: { border: "1px solid #d1d5db", padding: 8, marginBottom: 12 },
  image: { width: "100%", height: 180, objectFit: "cover", marginBottom: 8 }
});

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase, project } = await requireProject(projectId);
  const [roomsResult, notesResult, inspirationsResult] = await Promise.all([
    supabase.from("rooms").select("*").eq("project_id", projectId).order("name"),
    supabase.from("designer_brief_room_notes").select("*").eq("project_id", projectId),
    supabase.from("inspirations").select("*").eq("project_id", projectId).eq("selected_for_designer", true)
  ]);

  const zip = new JSZip();

  for (const room of roomsResult.data ?? []) {
    const note = notesResult.data?.find((item) => item.room_id === room.id);
    const inspirations = await Promise.all((inspirationsResult.data ?? [])
      .filter((item) => item.room_id === room.id)
      .map(async (item) => ({ ...item, signedUrl: await signedUrl(item.storage_bucket, item.storage_path) })));

    const pdf = await renderToBuffer(
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Brief projektowy: {room.name}</Text>
          <Text>Projekt: {project.name}</Text>
          <Text>Styl: {project.style || "brak"}</Text>
          <Text style={styles.subtitle}>Opis pomieszczenia</Text>
          <Text>{room.concept_description || "Brak opisu koncepcji."}</Text>
          <Text style={styles.subtitle}>Notatka dla projektanta</Text>
          <Text>{note?.note || "Brak notatki."}</Text>
          <Text style={styles.subtitle}>Wybrane inspiracje</Text>
          {inspirations.map((item) => (
            <View key={item.id} style={styles.card}>
              {item.signedUrl ? <Image src={item.signedUrl} style={styles.image} /> : null}
              <Text>{item.title}</Text>
              <Text>{item.designer_note || "Brak notatki."}</Text>
            </View>
          ))}
        </Page>
      </Document>
    );
    zip.file(`designer-brief-${slugify(project.name)}-${slugify(room.name)}-${new Date().toISOString().slice(0, 10)}.pdf`, pdf);
  }

  const content = await zip.generateAsync({ type: "uint8array" });
  const filename = `designer-brief-${slugify(project.name)}-${new Date().toISOString().slice(0, 10)}.zip`;

  const body = content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength) as ArrayBuffer;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
