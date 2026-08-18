/**
 * Event times are entered and shown in the business timezone (America/New_York),
 * but stored as real instants (timestamptz). These helpers convert a wall-clock
 * datetime-local value to a UTC instant on save, and format an instant back to
 * ET for display and for the datetime-local editor field.
 */

const TZ = "America/New_York";

/** Minutes that ET is offset from UTC at a given instant (e.g. -240 in EDT). */
function etOffsetMinutes(date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value;
  const asUTC = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour === "24" ? "0" : p.hour),
    Number(p.minute),
    Number(p.second)
  );
  return (asUTC - date.getTime()) / 60000;
}

/**
 * Interpret a "YYYY-MM-DDTHH:mm" datetime-local value as ET wall-clock time and
 * return the UTC ISO instant. Returns null for empty input.
 */
export function etWallToInstant(local: string | null | undefined): string | null {
  if (!local) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local.trim());
  if (!m) return null;
  // First approximation: treat the wall time as if it were UTC.
  const guess = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00Z`);
  const off = etOffsetMinutes(guess);
  // ET wall time W is at UTC = W - offset.
  return new Date(guess.getTime() - off * 60000).toISOString();
}

/** Format a stored instant as a friendly ET string, e.g. "Wed, Aug 20 at 2:00 PM". */
export function formatEventWhen(iso: string | null): string {
  if (!iso) return "Date to be announced";
  return new Date(iso).toLocaleString("en-US", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Month abbreviation + day-of-month in ET, for the events-list date tile. */
export function eventDateTile(iso: string | null): { month: string; day: string } {
  if (!iso) return { month: "TBD", day: "•" };
  const d = new Date(iso);
  return {
    month: d.toLocaleString("en-US", { timeZone: TZ, month: "short" }).toUpperCase(),
    day: d.toLocaleString("en-US", { timeZone: TZ, day: "numeric" }),
  };
}

/** True when the stored instant is in the past (event already happened). */
export function eventIsPast(iso: string | null): boolean {
  return !!iso && new Date(iso).getTime() < Date.now();
}

/** Longer format for the invite email + public page. */
export function formatEventWhenLong(iso: string | null): string {
  if (!iso) return "Date to be announced";
  return new Date(iso).toLocaleString("en-US", {
    timeZone: TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** An instant back to a "YYYY-MM-DDTHH:mm" ET value for a datetime-local input. */
export function toEtLocalInput(iso: string | null): string {
  if (!iso) return "";
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(new Date(iso))) p[part.type] = part.value;
  const hour = p.hour === "24" ? "00" : p.hour;
  return `${p.year}-${p.month}-${p.day}T${hour}:${p.minute}`;
}
