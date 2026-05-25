export const labels = {
  projectStage: {
    PLANNING: "Planowanie",
    CONCEPT: "Koncepcja",
    QUOTES: "Wyceny",
    IN_PROGRESS: "W trakcie",
    FINISHING: "Wykończenie",
    DONE: "Gotowe",
  },
  roomStatus: {
    NOT_STARTED: "Nierozpoczęte",
    CONCEPT: "Koncepcja",
    PRICING: "Wycena",
    ORDERING: "Zamówienia",
    IN_PROGRESS: "W trakcie",
    DONE: "Gotowe",
  },
  taskStatus: {
    TODO: "Do zrobienia",
    IN_PROGRESS: "W trakcie",
    DONE: "Gotowe",
    BLOCKED: "Zablokowane",
  },
  priority: {
    LOW: "Niska",
    MEDIUM: "Średnia",
    HIGH: "Wysoka",
    URGENT: "Pilna",
  },
  budgetStatus: {
    PLANNED: "Planowane",
    QUOTED: "Wycenione",
    ORDERED: "Zamówione",
    PAID: "Opłacone",
    CANCELLED: "Anulowane",
  },
  budgetCategory: {
    CONSTRUCTION_WORKS: "Prace budowlane",
    ELECTRICAL: "Elektryka",
    PLUMBING: "Hydraulika",
    BATHROOM: "Łazienka",
    KITCHEN: "Kuchnia",
    FLOORING: "Podłoga",
    DOORS: "Drzwi",
    LIGHTING: "Oświetlenie",
    FURNITURE: "Meble",
    APPLIANCES: "AGD",
    DECORATION: "Dekoracje",
    RESERVE: "Rezerwa",
    OTHER: "Inne",
  },
  productStatus: {
    FOUND: "Znalezione",
    SHORTLISTED: "Krótka lista",
    SELECTED: "Wybrane",
    ORDERED: "Zamówione",
    DELIVERED: "Dostarczone",
    INSTALLED: "Zamontowane",
    RETURNED: "Zwrócone",
  },
  deliveryStatus: {
    NOT_ORDERED: "Niezamówione",
    ORDERED: "Zamówione",
    SHIPPED: "Wysłane",
    DELIVERED: "Dostarczone",
    DELAYED: "Opóźnione",
    RETURNED: "Zwrócone",
  },
  decisionStatus: {
    NOT_STARTED: "Nierozpoczęta",
    RESEARCH: "Research",
    SHORTLIST: "Krótka lista",
    DECIDED: "Podjęta",
  },
  approvalStatus: {
    PENDING: "Oczekuje",
    APPROVED: "Zaakceptowana",
    REJECTED: "Odrzucona",
  },
  vendorStatus: {
    CONTACTED: "Kontakt",
    QUOTED: "Wycena",
    SELECTED: "Wybrany",
    REJECTED: "Odrzucony",
  },
  vendorType: {
    GENERAL_CONTRACTOR: "Generalny wykonawca",
    ELECTRICIAN: "Elektryk",
    PLUMBER: "Hydraulik",
    CARPENTER: "Stolarz",
    PAINTER: "Malarz",
    TILER: "Glazurnik",
    DESIGNER: "Projektant",
    OTHER: "Inny",
  },
  inspirationSource: {
    UPLOAD: "Zdjęcie",
    URL: "Link",
    PINTEREST: "Pinterest",
  },
  planType: {
    ORIGINAL: "Plan pierwotny",
    DESIGNER: "Plan projektanta",
  },
  planDifferenceStatus: {
    ACCEPTED: "Zaakceptowane",
    NEEDS_DISCUSSION: "Do omówienia",
    REJECTED: "Odrzucone",
  },
  documentType: {
    INVOICE: "Faktura",
    RECEIPT: "Paragon",
    WARRANTY: "Gwarancja",
    CONTRACT: "Umowa",
    OFFER: "Oferta",
    TECHNICAL_DRAWING: "Rysunek techniczny",
    PROTOCOL: "Protokół",
    DELIVERY_NOTE: "WZ",
    OTHER: "Inne",
  },
  scheduleStatus: {
    PLANNED: "Planowane",
    IN_PROGRESS: "W trakcie",
    DONE: "Gotowe",
    DELAYED: "Opóźnione",
    CANCELLED: "Anulowane",
  },
  paymentStatus: {
    PLANNED: "Planowana",
    DUE: "Do zapłaty",
    PAID: "Zapłacona",
    OVERDUE: "Zaległa",
    CANCELLED: "Anulowana",
  },
  punchListSeverity: {
    LOW: "Niska",
    MEDIUM: "Średnia",
    HIGH: "Wysoka",
    CRITICAL: "Krytyczna",
  },
  punchListStatus: {
    NEW: "Nowa",
    REPORTED: "Zgłoszona",
    IN_PROGRESS: "W trakcie",
    FIXED: "Naprawiona",
    ACCEPTED: "Odebrana",
  },
  questionStatus: {
    OPEN: "Otwarte",
    ANSWERED: "Odpowiedziane",
    NEEDS_FOLLOW_UP: "Do dopytania",
    CLOSED: "Zamknięte",
  },
  memberRole: {
    OWNER: "Właściciel",
    EDITOR: "Edytor",
    VIEWER: "Przeglądający",
    DESIGNER: "Projektant",
    CONTRACTOR: "Wykonawca",
  },
  constraintType: {
    DISLIKE: "Nie lubię",
    MUST_HAVE: "Must-have",
    AVOID: "Unikam",
    TECHNICAL_CONSTRAINT: "Ograniczenie techniczne",
    BUDGET_CONSTRAINT: "Ograniczenie budżetowe",
  },
  shareScope: {
    WHOLE_PROJECT: "Cały projekt",
    SELECTED_ROOMS: "Wybrane pomieszczenia",
    INSPIRATIONS_ONLY: "Tylko inspiracje",
    PLANS_ONLY: "Tylko plany",
    PLAN_COMPARISON: "Porównanie planów",
    DESIGNER_BRIEFS: "Brief dla projektanta",
    CONTRACTOR_PACKAGE: "Pakiet wykonawcy",
  },
} as const;

export type LabelMap = Record<string, string>;

export function labelFor<T extends LabelMap>(map: T, value?: string | null): string {
  if (!value) return "—";
  return (map as Record<string, string>)[value] ?? value;
}

// Kolory statusów dla Badge
export type BadgeVariant = "gray" | "green" | "blue" | "amber" | "red";

export function statusVariant(status?: string | null): BadgeVariant {
  switch (status) {
    case "DONE":
    case "ACCEPTED":
    case "SELECTED":
    case "PAID":
    case "DELIVERED":
    case "INSTALLED":
    case "FIXED":
    case "APPROVED":
      return "green";
    case "IN_PROGRESS":
    case "RESEARCH":
    case "SHORTLIST":
    case "ORDERED":
    case "SHIPPED":
    case "REPORTED":
      return "blue";
    case "BLOCKED":
    case "NEEDS_DISCUSSION":
    case "DUE":
    case "DELAYED":
    case "URGENT":
    case "HIGH":
    case "CRITICAL":
    case "PENDING":
      return "amber";
    case "REJECTED":
    case "CANCELLED":
    case "OVERDUE":
    case "RETURNED":
      return "red";
    default:
      return "gray";
  }
}
