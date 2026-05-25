import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 40,
    backgroundColor: "#FFFFFF",
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 16,
  },
  projectName: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 4,
  },
  roomTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  roomMeta: {
    fontSize: 10,
    color: "#6b7280",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#374151",
  },
  note: {
    backgroundColor: "#f9fafb",
    borderLeftWidth: 3,
    borderLeftColor: "#6366f1",
    padding: 10,
    borderRadius: 4,
    fontSize: 11,
    lineHeight: 1.5,
  },
  concept: {
    fontSize: 11,
    color: "#374151",
    lineHeight: 1.6,
  },
  constraintItem: {
    marginBottom: 4,
    flexDirection: "row",
    gap: 6,
  },
  constraintBullet: {
    fontSize: 11,
    color: "#6b7280",
  },
  constraintText: {
    fontSize: 11,
    flex: 1,
  },
  inspirationsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  inspirationCard: {
    width: "47%",
    marginBottom: 16,
  },
  inspirationImage: {
    width: "100%",
    height: 160,
    objectFit: "cover",
    borderRadius: 6,
    marginBottom: 6,
  },
  inspirationTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  inspirationNote: {
    fontSize: 9,
    color: "#6b7280",
    fontStyle: "italic",
  },
  inspirationCategory: {
    fontSize: 9,
    color: "#9ca3af",
    marginBottom: 2,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    color: "#9ca3af",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
});

interface Props {
  project: { name: string; style: string | null; area: number | null; description: string | null };
  room: { id: string; name: string; area: number | null; concept_description: string | null; notes: string | null };
  inspirations: {
    id: string;
    title: string;
    category: string | null;
    designer_note: string | null;
    external_url: string | null;
    source: string;
  }[];
  imageMap: Record<string, string | null>;
  note: string | null;
  constraints: { type: string; description: string }[];
}

export function DesignerBriefPDF({ project, room, inspirations, imageMap, note, constraints }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.projectName}>{project.name}</Text>
          <Text style={styles.roomTitle}>{room.name}</Text>
          {room.area && (
            <Text style={styles.roomMeta}>Powierzchnia: {room.area} m²</Text>
          )}
        </View>

        {/* Concept */}
        {room.concept_description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Koncepcja</Text>
            <Text style={styles.concept}>{room.concept_description}</Text>
          </View>
        )}

        {/* Designer note */}
        {note && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notatka</Text>
            <View style={styles.note}>
              <Text>{note}</Text>
            </View>
          </View>
        )}

        {/* Constraints */}
        {constraints.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wymagania i ograniczenia</Text>
            {constraints.map((c, i) => (
              <View key={i} style={styles.constraintItem}>
                <Text style={styles.constraintBullet}>•</Text>
                <Text style={styles.constraintText}>{c.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Inspirations */}
        {inspirations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inspiracje ({inspirations.length})</Text>
            <View style={styles.inspirationsGrid}>
              {inspirations.map((insp) => {
                const imgUrl = imageMap[insp.id];
                return (
                  <View key={insp.id} style={styles.inspirationCard}>
                    {imgUrl && (
                      <Image src={imgUrl} style={styles.inspirationImage} />
                    )}
                    {insp.category && (
                      <Text style={styles.inspirationCategory}>{insp.category}</Text>
                    )}
                    <Text style={styles.inspirationTitle}>{insp.title}</Text>
                    {insp.designer_note && (
                      <Text style={styles.inspirationNote}>{`"${insp.designer_note}"`}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Planner Mieszkanie — Brief wygenerowany {new Date().toLocaleDateString("pl-PL")}
        </Text>
      </Page>
    </Document>
  );
}
