/**
 * Upcoming staff work anniversaries and birthdays, for the weekly reminder the
 * admin team gets. Dates come from the roster (hire_date / birth_date, synced
 * from Connecteam or entered by hand). Only the month and day matter, so this
 * finds the next occurrence of each within a lookahead window.
 */

import { query } from "./db";
import { getIntegrationState, setIntegrationState } from "./integration-state";
import { sendTeamRecognitionDigest } from "./email";

const DIGEST_KEY = "recognition_digest";
const RANGE_DAYS = 14;

export type RecognitionKind = "anniversary" | "birthday";

export type RecognitionItem = {
  name: string;
  title: string | null;
  kind: RecognitionKind;
  /** The upcoming occurrence, YYYY-MM-DD. */
  date: string;
  /** Years of service on that anniversary (anniversaries only). */
  years?: number;
};

type Row = {
  name: string;
  title: string | null;
  hire_date: string | null;
  birth_date: string | null;
};

// Next occurrence of a month/day at or after `today` (both handled in UTC to
// avoid timezone drift on date-only values).
function nextOccurrence(dateStr: string, today: Date): Date {
  const [, mm, dd] = dateStr.slice(0, 10).split("-").map(Number);
  const y = today.getUTCFullYear();
  let occ = new Date(Date.UTC(y, mm - 1, dd));
  const midnightToday = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  if (occ.getTime() < midnightToday.getTime()) {
    occ = new Date(Date.UTC(y + 1, mm - 1, dd));
  }
  return occ;
}

function withinDays(occ: Date, today: Date, days: number): boolean {
  const midnightToday = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  const diff = (occ.getTime() - midnightToday.getTime()) / 86_400_000;
  return diff >= 0 && diff <= days;
}

/** Anniversaries + birthdays coming up within `days`, soonest first. */
export async function upcomingRecognition(
  now: Date,
  days = 14
): Promise<RecognitionItem[]> {
  const rows = await query<Row>(
    `SELECT name, title, hire_date::text, birth_date::text
       FROM employees
      WHERE active = TRUE
        AND (hire_date IS NOT NULL OR birth_date IS NOT NULL)`
  );

  const items: RecognitionItem[] = [];
  for (const r of rows) {
    if (r.hire_date) {
      const occ = nextOccurrence(r.hire_date, now);
      const years = occ.getUTCFullYear() - Number(r.hire_date.slice(0, 4));
      // Skip the "0-year" case (hired within the last year: no anniversary yet).
      if (years >= 1 && withinDays(occ, now, days)) {
        items.push({
          name: r.name,
          title: r.title,
          kind: "anniversary",
          date: occ.toISOString().slice(0, 10),
          years,
        });
      }
    }
    if (r.birth_date) {
      const occ = nextOccurrence(r.birth_date, now);
      if (withinDays(occ, now, days)) {
        items.push({
          name: r.name,
          title: r.title,
          kind: "birthday",
          date: occ.toISOString().slice(0, 10),
        });
      }
    }
  }

  items.sort((a, b) => a.date.localeCompare(b.date));
  return items;
}

/** Who gets the reminder. Defaults to hello@joyseniorcare.com; overridable. */
export function recognitionRecipients(): string[] {
  const raw = process.env.TEAM_NOTIFY_TO || "hello@joyseniorcare.com";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Send the weekly recognition digest if it's been at least ~a week since the
 * last one. `now` is passed in so the caller owns the clock. Returns null when
 * it wasn't due, otherwise a small result.
 */
export async function sendRecognitionDigestIfDue(
  now: Date,
  minDays = 7
): Promise<{ sent: boolean; count: number } | null> {
  let state: { at?: string } | null = null;
  try {
    state = await getIntegrationState<{ at?: string }>(DIGEST_KEY);
  } catch {
    return null; // integration_state table not present yet
  }
  if (state?.at) {
    const ageMs = now.getTime() - new Date(state.at).getTime();
    if (ageMs < minDays * 86_400_000) return null; // too soon
  }

  const items = await upcomingRecognition(now, RANGE_DAYS);
  // Advance the timer regardless so the digest stays weekly, not per-cron-tick.
  await setIntegrationState(DIGEST_KEY, { at: now.toISOString(), count: items.length });
  if (items.length === 0) return { sent: false, count: 0 };

  const ok = await sendTeamRecognitionDigest({
    to: recognitionRecipients(),
    items,
    rangeDays: RANGE_DAYS,
  });
  return { sent: ok, count: items.length };
}
