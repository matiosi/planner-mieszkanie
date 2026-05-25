export const navLabels = {
  dashboard: "Pulpit",
  nextActions: "Co teraz?",
  rooms: "Pomieszczenia",
  budget: "Budżet",
  tasks: "Zadania",
  products: "Produkty",
  decisions: "Decyzje",
  vendors: "Wykonawcy",
  inspirations: "Inspiracje",
  plans: "Plany"
};

export const labels = {
  projectStage: {
    PLANNING: "Planowanie",
    CONCEPT: "Koncepcja",
    QUOTES: "Wyceny",
    IN_PROGRESS: "W trakcie",
    FINISHING: "Wykończenie",
    DONE: "Gotowe"
  },
  roomStatus: {
    NOT_STARTED: "Nierozpoczęte",
    CONCEPT: "Koncepcja",
    PRICING: "Wycena",
    ORDERING: "Zamówienia",
    IN_PROGRESS: "W trakcie",
    DONE: "Gotowe"
  },
  taskStatus: {
    TODO: "Do zrobienia",
    IN_PROGRESS: "W trakcie",
    DONE: "Gotowe",
    BLOCKED: "Zablokowane"
  },
  priority: {
    LOW: "Niska",
    MEDIUM: "Średnia",
    HIGH: "Wysoka",
    URGENT: "Pilna"
  },
  budgetStatus: {
    PLANNED: "Planowane",
    QUOTED: "Wycenione",
    ORDERED: "Zamówione",
    PAID: "Opłacone",
    CANCELLED: "Anulowane"
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
    OTHER: "Inne"
  },
  productStatus: {
    FOUND: "Znalezione",
    SHORTLISTED: "Krótka lista",
    SELECTED: "Wybrane",
    ORDERED: "Zamówione",
    DELIVERED: "Dostarczone",
    INSTALLED: "Zamontowane",
    RETURNED: "Zwrócone"
  },
  deliveryStatus: {
    NOT_ORDERED: "Niezamówione",
    ORDERED: "Zamówione",
    SHIPPED: "Wysłane",
    DELIVERED: "Dostarczone",
    DELAYED: "Opóźnione",
    RETURNED: "Zwrócone"
  },
  decisionStatus: {
    NOT_STARTED: "Nierozpoczęta",
    RESEARCH: "Research",
    SHORTLIST: "Krótka lista",
    DECIDED: "Podjęta"
  },
  vendorStatus: {
    CONTACTED: "Kontakt",
    QUOTED: "Wycena",
    SELECTED: "Wybrany",
    REJECTED: "Odrzucony"
  },
  vendorType: {
    GENERAL_CONTRACTOR: "Generalny wykonawca",
    ELECTRICIAN: "Elektryk",
    PLUMBER: "Hydraulik",
    CARPENTER: "Stolarz",
    PAINTER: "Malarz",
    TILER: "Glazurnik",
    DESIGNER: "Projektant",
    OTHER: "Inny"
  },
  inspirationSource: {
    UPLOAD: "Zdjęcie",
    URL: "Link"
  },
  planType: {
    ORIGINAL: "Plan pierwotny",
    DESIGNER: "Plan projektanta"
  },
  planDifferenceStatus: {
    ACCEPTED: "Zaakceptowane",
    NEEDS_DISCUSSION: "Do omówienia",
    REJECTED: "Odrzucone"
  }
} as const;

export function labelFor<T extends Record<string, string>>(map: T, value?: string | null) {
  if (!value) return "Brak";
  return map[value as keyof T] ?? value;
}
