export const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  year: "numeric",
  month: "short",
  day: "numeric"
});

export const currencyFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 0
});

export const numberFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 2
});

export function formatDate(value?: string | null) {
  if (!value) return "Brak daty";
  return dateFormatter.format(new Date(value));
}

export function formatCurrency(value?: number | null) {
  return currencyFormatter.format(value ?? 0);
}
