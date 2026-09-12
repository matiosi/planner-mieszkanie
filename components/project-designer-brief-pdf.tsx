import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { EmbeddedPdfImage } from "@/lib/pdf-image";

const styles = StyleSheet.create({
  page: {
    padding: 44,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#172033",
    backgroundColor: "#ffffff",
  },
  cover: {
    paddingTop: 120,
  },
  eyebrow: {
    color: "#64748b",
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  projectName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 26,
    marginBottom: 8,
  },
  projectMeta: {
    color: "#475569",
    fontSize: 11,
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 15,
    marginBottom: 12,
  },
  scanHeader: {
    borderBottomWidth: 2,
    borderBottomColor: "#64748b",
    paddingBottom: 10,
    marginBottom: 16,
  },
  scanTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    marginBottom: 3,
  },
  scanFrame: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  scanImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  roomHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 9,
    marginBottom: 14,
  },
  roomName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 19,
    marginBottom: 3,
  },
  roomMeta: {
    color: "#64748b",
    fontSize: 9,
  },
  body: {
    color: "#334155",
    lineHeight: 1.5,
  },
  roomSection: {
    marginBottom: 14,
  },
  roomSectionTitle: {
    color: "#64748b",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  note: {
    backgroundColor: "#f8fafc",
    borderLeftWidth: 3,
    borderLeftColor: "#2563eb",
    padding: 8,
    color: "#334155",
    lineHeight: 1.45,
  },
  constraint: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 3,
  },
  bullet: {
    color: "#2563eb",
  },
  inspirationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  inspirationCard: {
    width: "48%",
    marginBottom: 12,
  },
  inspirationImage: {
    width: "100%",
    height: 132,
    objectFit: "cover",
    borderRadius: 4,
    backgroundColor: "#e2e8f0",
  },
  noImage: {
    width: "100%",
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
  },
  noImageText: {
    color: "#94a3b8",
    fontSize: 8,
  },
  inspirationTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    marginTop: 5,
    marginBottom: 2,
  },
  inspirationCategory: {
    color: "#64748b",
    fontSize: 8,
    marginBottom: 3,
  },
  inspirationDescription: {
    color: "#334155",
    fontSize: 8,
    lineHeight: 1.35,
  },
  inspirationNote: {
    color: "#475569",
    fontSize: 8,
    lineHeight: 1.35,
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    borderTopWidth: 0.5,
    borderTopColor: "#cbd5e1",
    paddingTop: 5,
    color: "#94a3b8",
    fontSize: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export interface ProjectBriefInspiration {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  designerNote: string | null;
  imageUrl: string | EmbeddedPdfImage | null;
}

export interface ProjectBriefSection {
  id: string;
  name: string;
  area: number | null;
  concept: string | null;
  note: string | null;
  constraints: string[];
  inspirations: ProjectBriefInspiration[];
}

interface Props {
  project: {
    name: string;
    style: string | null;
    area: number | null;
    description: string | null;
  };
  surveyScans: { id: string; title: string; roomName: string | null; imageUrl: EmbeddedPdfImage | null }[];
  sections: ProjectBriefSection[];
  generatedAt: string;
}

function Footer({ projectName, generatedAt }: { projectName: string; generatedAt: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{projectName} — brief dla projektanta</Text>
      <Text>{generatedAt}</Text>
    </View>
  );
}

export function ProjectDesignerBriefPDF({ project, surveyScans, sections, generatedAt }: Props) {
  return (
    <Document>
      <Page size="A4" style={[styles.page, styles.cover]}>
        <Text style={styles.eyebrow}>Brief dla projektanta</Text>
        <Text style={styles.projectName}>{project.name}</Text>
        {project.style && <Text style={styles.projectMeta}>Styl: {project.style}</Text>}
        {project.area && <Text style={styles.projectMeta}>Powierzchnia: {project.area} m²</Text>}
        {project.description && <Text style={[styles.projectMeta, { marginTop: 16 }]}>{project.description}</Text>}
        <Footer projectName={project.name} generatedAt={generatedAt} />
      </Page>

      {surveyScans.map((scan) => (
        <Page key={scan.id} size="A4" style={styles.page}>
          <View style={styles.scanHeader}>
            <Text style={styles.scanTitle}>Odpowiedź na ankietę</Text>
            <Text style={styles.roomMeta}>{scan.title}{scan.roomName ? ` — ${scan.roomName}` : ""}</Text>
          </View>
          <View style={styles.scanFrame}>
            {scan.imageUrl ? <Image src={scan.imageUrl} style={styles.scanImage} /> : <Text style={styles.noImageText}>Brak zdjęcia ankiety</Text>}
          </View>
          <Footer projectName={project.name} generatedAt={generatedAt} />
        </Page>
      ))}

      {sections.map((section) => (
        <Page key={section.id} size="A4" style={styles.page} wrap>
          <View style={styles.roomHeader}>
            <Text style={styles.roomName}>{section.name}</Text>
            {section.area && <Text style={styles.roomMeta}>Powierzchnia: {section.area} m²</Text>}
          </View>
          {section.concept && (
            <View style={styles.roomSection}>
              <Text style={styles.roomSectionTitle}>Koncepcja</Text>
              <Text style={styles.body}>{section.concept}</Text>
            </View>
          )}
          {section.note && (
            <View style={styles.roomSection}>
              <Text style={styles.roomSectionTitle}>Notatka dla projektanta</Text>
              <Text style={styles.note}>{section.note}</Text>
            </View>
          )}
          {section.constraints.length > 0 && (
            <View style={styles.roomSection}>
              <Text style={styles.roomSectionTitle}>Wymagania i ograniczenia</Text>
              {section.constraints.map((constraint, index) => (
                <View key={`${section.id}-${index}`} style={styles.constraint}>
                  <Text style={styles.bullet}>•</Text><Text style={styles.body}>{constraint}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.roomSection}>
            <Text style={styles.sectionTitle}>Inspiracje ({section.inspirations.length})</Text>
            {section.inspirations.length ? (
              <View style={styles.inspirationGrid}>
                {section.inspirations.map((inspiration) => (
                  <View key={inspiration.id} style={styles.inspirationCard} wrap={false}>
                    {inspiration.imageUrl ? <Image src={inspiration.imageUrl} style={styles.inspirationImage} /> : <View style={styles.noImage}><Text style={styles.noImageText}>Brak zdjęcia</Text></View>}
                    <Text style={styles.inspirationTitle}>{inspiration.title}</Text>
                    {inspiration.category && <Text style={styles.inspirationCategory}>{inspiration.category}</Text>}
                    {inspiration.description && <Text style={styles.inspirationDescription}>{inspiration.description}</Text>}
                    {inspiration.designerNote && <Text style={styles.inspirationNote}>Wskazówka: {inspiration.designerNote}</Text>}
                  </View>
                ))}
              </View>
            ) : <Text style={styles.body}>Brak wybranych inspiracji.</Text>}
          </View>
          <Footer projectName={project.name} generatedAt={generatedAt} />
        </Page>
      ))}
    </Document>
  );
}
