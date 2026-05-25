import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { requireProject, signedUrl } from "@/lib/data";
import { slugify } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: "#1f2937" },
  title: { fontSize: 22, marginBottom: 8, fontWeight: 700 },
  subtitle: { fontSize: 14, marginTop: 16, marginBottom: 8, fontWeight: 700 },
  meta: { color: "#4b5563", marginBottom: 4 },
  grid: { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: "47%", border: "1px solid #d1d5db", padding: 8, marginBottom: 12 },
  image: { width: "100%", height: 140, objectFit: "cover", marginBottom: 8 },
  note: { marginTop: 6, color: "#374151" }
});

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string; roomId: string }> }) {
  const { projectId, roomId } = await params;
  const { supabase, project } = await requireProject(projectId);
  const [roomResult, noteResult, inspirationsResult] = await Promise.all([
    supabase.from("rooms").select("*").eq("project_id", projectId).eq("id", roomId).single(),
    supabase.from("designer_brief_room_notes").select("*").eq("project_id", projectId).eq("room_id", roomId).maybeSingle(),
    supabase.from("inspirations").select("*").eq("project_id", projectId).eq("room_id", roomId).eq("selected_for_designer", true)
  ]);

  const room = roomResult.data;
  if (!room) return NextResponse.json({ error: "Nie znaleziono pomieszczenia." }, { status: 404 });

  const inspirations = await Promise.all((inspirationsResult.data ?? []).map(async (item) => ({
    ...item,
    signedUrl: await signedUrl(item.storage_bucket, item.storage_path)
  })));

  const pdf = await renderToBuffer(
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Brief projektowy: {room.name}</Text>
        <Text style={styles.meta}>Projekt: {project.name}</Text>
        <Text style={styles.meta}>Metraż projektu: {project.area ?? "brak"} m²</Text>
        <Text style={styles.meta}>Styl: {project.style || "brak"}</Text>
        <Text style={styles.meta}>Budżet docelowy: {project.target_budget ?? "brak"} PLN</Text>
        <Text style={styles.subtitle}>Opis pomieszczenia</Text>
        <Text>{room.concept_description || "Brak opisu koncepcji."}</Text>
        <Text style={styles.subtitle}>Notatka dla projektanta</Text>
        <Text>{noteResult.data?.note || "Brak notatki."}</Text>
        <Text style={styles.subtitle}>Wybrane inspiracje</Text>
        <View style={styles.grid}>
          {inspirations.map((item) => (
            <View key={item.id} style={styles.card}>
              {item.signedUrl ? <Image src={item.signedUrl} style={styles.image} /> : null}
              <Text>{item.title}</Text>
              <Text style={styles.note}>{item.designer_note || "Brak notatki."}</Text>
              <Text style={styles.note}>Źródło: {item.external_url || item.source}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );

  const filename = `designer-brief-${slugify(project.name)}-${slugify(room.name)}-${new Date().toISOString().slice(0, 10)}.pdf`;
  const body = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
