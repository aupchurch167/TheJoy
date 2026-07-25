/**
 * Shared display formatters for the admin UI. One place, so every screen shows
 * dates, money, percentages, and empty values the same way.
 */

/** Human date: "Jul 25, 2026". Returns an em-dash for null/invalid input. */
export function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Human date + time: "Jul 25, 2026, 3:14 PM". Em-dash for null/invalid. */
export function formatDateTime(value?: string | Date | null): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Currency with $ and commas: 5000 -> "$5,000". Em-dash for null. */
export function formatCurrency(value?: number | null, fractionDigits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/** Percentage with one decimal: 0.421 (ratio) -> "42.1%". Em-dash for null. */
export function formatPercent(ratio?: number | null): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return "—";
  return `${(ratio * 100).toFixed(1)}%`;
}

/** Abbreviate large counts: 1200 -> "1.2K", 3_400_000 -> "3.4M". */
export function formatCompact(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (Math.abs(value) < 1000) return String(value);
  return value.toLocaleString("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

/** Show a value or an em-dash when it is empty/null (never "" or "null"). */
export function orDash(value?: string | number | null): string {
  if (value === null || value === undefined) return "—";
  const s = String(value).trim();
  return s === "" ? "—" : s;
}
