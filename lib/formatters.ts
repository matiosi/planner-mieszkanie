export const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export const dateTimeFormatter = new Intl.DateTimeFormat("pl-PL", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const currencyFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 0,
});

export const numberFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 2,
});

export function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  try {
    return dateFormatter.format(new Date(value));
  } catch {
    return "—";
  }
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return "—";
  try {
    return dateTimeFormatter.format(new Date(value));
  } catch {
    return "—";
  }
}

export function formatCurrency(value?: number | null): string {
  if (value == null) return "—";
  return currencyFormatter.format(value);
}

export function formatNumber(value?: number | null): string {
  if (value == null) return "—";
  return numberFormatter.format(value);
}

export function formatArea(value?: number | null): string {
  if (value == null) return "—";
  return `${numberFormatter.format(value)} m²`;
}

export function formatPercent(part: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

export function formatDistanceToNow(value?: string | Date | null): string {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "przed chwilą";
  if (diffMin < 60) return `${diffMin} min temu`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} godz. temu`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} dni temu`;
  return dateFormatter.format(date);
}
