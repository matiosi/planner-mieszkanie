import { NextResponse } from "next/server";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { requireProjectAccess } from "@/lib/data";
import { labelFor, labels } from "@/lib/labels";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: "#111827" },
  title: { fontSize: 22, marginBottom: 4, fontWeight: 700 },
  muted: { color: "#6b7280" },
  section: { marginTop: 18 },
  row: { borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingVertical: 8 },
  itemTitle: { fontSize: 12, fontWeight: 700 },
  meta: { marginTop: 3, color: "#4b5563" },
  signature: { marginTop: 48, flexDirection: "row", gap: 32 },
  signatureLine: { flex: 1, borderTopWidth: 1, borderTopColor: "#9ca3af", paddingTop: 6, color: "#6b7280" },
});

function ProtocolPdf({
  project,
  items,
}: {
  project: { name: string };
  items: Array<{
    title: string;
    description: string | null;
    severity: string;
    status: string;
    due_date: string | null;
    roomName?: string | null;
    vendorName?: string | null;
  }>;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Protokol odbioru prac</Text>
        <Text style={styles.muted}>Projekt: {project.name}</Text>
        <Text style={styles.muted}>Wygenerowano: {new Date().toLocaleDateString("pl-PL")}</Text>

        <View style={styles.section}>
          {items.map((item, index) => (
            <View key={`${item.title}-${index}`} style={styles.row}>
              <Text style={styles.itemTitle}>{index + 1}. {item.title}</Text>
              <Text style={styles.meta}>
                Status: {labelFor(labels.punchListStatus, item.status)} · Waga: {labelFor(labels.punchListSeverity, item.severity)}
                {item.roomName ? ` · Pomieszczenie: ${item.roomName}` : ""}
                {item.vendorName ? ` · Wykonawca: ${item.vendorName}` : ""}
                {item.due_date ? ` · Termin: ${item.due_date}` : ""}
              </Text>
              {item.description && <Text style={styles.meta}>{item.description}</Text>}
            </View>
          ))}
          {!items.length && <Text>Brak usterek w protokole.</Text>}
        </View>

        <View style={styles.signature}>
          <Text style={styles.signatureLine}>Podpis inwestora</Text>
          <Text style={styles.signatureLine}>Podpis wykonawcy</Text>
        </View>
      </Page>
    </Document>
  );
}

function relationName(value: unknown) {
  if (Array.isArray(value)) {
    const first = value[0] as { name?: string } | undefined;
    return first?.name ?? null;
  }
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name?: unknown }).name ?? "");
  }
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { supabase, project } = await requireProjectAccess(projectId);
  const { data } = await supabase
    .from("punch_list_items")
    .select("title,description,severity,status,due_date,rooms(name),vendors(name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const items = (data ?? []).map((item) => ({
    title: item.title,
    description: item.description,
    severity: item.severity,
    status: item.status,
    due_date: item.due_date,
    roomName: relationName(item.rooms),
    vendorName: relationName(item.vendors),
  }));

  const buffer = await renderToBuffer(<ProtocolPdf project={project} items={items} />);
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="protokol-odbioru.pdf"`,
    },
  });
}
