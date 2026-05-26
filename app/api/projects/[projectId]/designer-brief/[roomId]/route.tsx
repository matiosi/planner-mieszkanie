import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser, signedUrl } from "@/lib/data";
import {
  renderToBuffer,
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import React from "react";

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111",
    backgroundColor: "#fff",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6",
    paddingBottom: 12,
    marginBottom: 20,
  },
  projectLabel: {
    fontSize: 9,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  projectName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#111",
    marginBottom: 4,
  },
  roomName: {
    fontSize: 13,
    color: "#3b82f6",
    fontFamily: "Helvetica-Bold",
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 6,
  },
  metaItem: {
    fontSize: 9,
    color: "#6b7280",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#6b7280",
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#374151",
  },
  constraintRow: {
    flexDirection: "row",
    marginBottom: 4,
    gap: 6,
  },
  bullet: {
    color: "#3b82f6",
    fontSize: 10,
  },
  constraintText: {
    fontSize: 10,
    color: "#374151",
    flex: 1,
  },
  inspirationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  inspirationCard: {
    width: "48%",
    marginBottom: 10,
  },
  inspirationImage: {
    width: "100%",
    height: 130,
    objectFit: "cover",
    borderRadius: 4,
    backgroundColor: "#f3f4f6",
  },
  inspirationNoImage: {
    width: "100%",
    height: 40,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  inspirationNoImageText: {
    fontSize: 8,
    color: "#9ca3af",
  },
  inspirationTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
    color: "#111",
  },
  inspirationNote: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
    lineHeight: 1.4,
  },
  inspirationLink: {
    fontSize: 8,
    color: "#3b82f6",
    marginTop: 2,
  },
  inspirationCategory: {
    fontSize: 8,
    color: "#9ca3af",
    marginTop: 1,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
  },
});

interface BriefPDFProps {
  projectName: string;
  projectStyle: string | null;
  roomName: string;
  concept: string | null;
  note: string | null;
  constraints: { type: string; description: string }[];
  inspirations: {
    id: string;
    title: string;
    category: string | null;
    designer_note: string | null;
    external_url: string | null;
    imageUrl: string | null;
  }[];
  generatedAt: string;
}

function BriefPDF({
  projectName,
  projectStyle,
  roomName,
  concept,
  note,
  constraints,
  inspirations,
  generatedAt,
}: BriefPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.projectName}>{projectName}</Text>
          <Text style={styles.roomName}>{roomName}</Text>
          {projectStyle && (
            <View style={styles.metaRow}>
              <Text style={styles.metaItem}>Styl: {projectStyle}</Text>
            </View>
          )}
        </View>

        {/* Koncepcja */}
        {concept && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Koncepcja</Text>
            <Text style={styles.bodyText}>{concept}</Text>
          </View>
        )}

        {/* Notatki */}
        {note && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notatka dla projektanta</Text>
            <Text style={styles.bodyText}>{note}</Text>
          </View>
        )}

        {/* Wymagania */}
        {constraints.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wymagania i ograniczenia</Text>
            {constraints.map((c, i) => (
              <View key={i} style={styles.constraintRow}>
                <Text style={styles.bullet}>*</Text>
                <Text style={styles.constraintText}>{c.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Inspiracje */}
        {inspirations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Inspiracje ({inspirations.length})
            </Text>
            <View style={styles.inspirationGrid}>
              {inspirations.map((insp) => (
                <View key={insp.id} style={styles.inspirationCard}>
                  {insp.imageUrl ? (
                    <Image src={insp.imageUrl} style={styles.inspirationImage} />
                  ) : (
                    <View style={styles.inspirationNoImage}>
                      <Text style={styles.inspirationNoImageText}>
                        brak zdjecia
                      </Text>
                    </View>
                  )}
                  <Text style={styles.inspirationTitle}>{insp.title}</Text>
                  {insp.category && (
                    <Text style={styles.inspirationCategory}>
                      {insp.category}
                    </Text>
                  )}
                  {insp.designer_note && (
                    <Text style={styles.inspirationNote}>
                      {insp.designer_note}
                    </Text>
                  )}
                  {insp.external_url && (
                    <Text style={styles.inspirationLink}>
                      {insp.external_url.length > 55
                        ? insp.external_url.slice(0, 55) + "..."
                        : insp.external_url}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {projectName} — {roomName}
          </Text>
          <Text style={styles.footerText}>{generatedAt}</Text>
        </View>
      </Page>
    </Document>
  );
}

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
        .select(
          "id,title,source,category,external_url,storage_bucket,storage_path,designer_note"
        )
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

    // Pobierz URL-e zdjęć dla inspiracji
    const inspirationsWithImages = await Promise.all(
      (inspirations ?? []).map(async (insp) => {
        let imageUrl: string | null = null;
        if (
          insp.source === "UPLOAD" &&
          insp.storage_bucket &&
          insp.storage_path
        ) {
          imageUrl = await signedUrl(insp.storage_bucket, insp.storage_path);
        } else if (insp.external_url) {
          imageUrl = insp.external_url;
        }
        return {
          id: insp.id,
          title: insp.title,
          category: insp.category,
          designer_note: insp.designer_note,
          external_url: insp.external_url,
          imageUrl,
        };
      })
    );

    const projectData = project ?? {
      name: "Projekt",
      style: null,
      area: null,
      description: null,
    };

    const now = new Date().toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const buffer = await renderToBuffer(
      <BriefPDF
        projectName={projectData.name}
        projectStyle={projectData.style}
        roomName={room.name}
        concept={room.concept_description}
        note={briefNote?.note ?? null}
        constraints={constraints ?? []}
        inspirations={inspirationsWithImages}
        generatedAt={now}
      />
    );

    const safeName = room.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="brief-${safeName || "pokoj"}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Brief PDF error:", err);
    return NextResponse.json(
      { error: "Nie udalo sie wygenerowac PDF" },
      { status: 500 }
    );
  }
}
