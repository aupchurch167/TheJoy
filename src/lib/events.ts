import { randomBytes } from "node:crypto";
import { query } from "./db";

/**
 * Events: create an event, send tokenized invite/reminder emails, collect RSVPs
 * on a public form, and see who is coming. Invites and reminders reuse the
 * broadcast email pipeline (throttled, deduped, suppression-aware). The public
 * RSVP page is reached by a lowercase-hex token (survives the path-lowercasing
 * middleware, like the feedback tokens).
 */

export type EventStatus = "draft" | "published" | "cancelled";
export type RsvpResponse = "yes" | "no" | "maybe";

export type EventRow = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
  capacity: number | null;
  rsvp_token: string;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EventRsvp = {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  response: RsvpResponse;
  guests: number;
  note: string | null;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
};

export type EventInput = {
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  capacity?: number | null;
  status?: EventStatus;
};

function newToken(): string {
  return randomBytes(16).toString("hex");
}

/* ---------------- events CRUD ---------------- */

export async function createEvent(
  input: EventInput,
  createdBy?: string | null
): Promise<EventRow> {
  const rows = await query<EventRow>(
    `INSERT INTO events
       (title, description, location, starts_at, ends_at, capacity, status,
        rsvp_token, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      input.title.trim(),
      input.description ?? "",
      input.location?.trim() || null,
      input.startsAt || null,
      input.endsAt || null,
      input.capacity ?? null,
      input.status ?? "draft",
      newToken(),
      createdBy ?? null,
    ]
  );
  return rows[0];
}

export async function updateEvent(
  id: string,
  input: EventInput
): Promise<EventRow | null> {
  const rows = await query<EventRow>(
    `UPDATE events SET
       title = $2, description = $3, location = $4, starts_at = $5, ends_at = $6,
       capacity = $7, status = $8, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      input.title.trim(),
      input.description ?? "",
      input.location?.trim() || null,
      input.startsAt || null,
      input.endsAt || null,
      input.capacity ?? null,
      input.status ?? "draft",
    ]
  );
  return rows[0] ?? null;
}

export async function deleteEvent(id: string): Promise<void> {
  await query(`DELETE FROM events WHERE id = $1`, [id]);
}

export async function listEvents(): Promise<EventRow[]> {
  return query<EventRow>(
    `SELECT * FROM events ORDER BY COALESCE(starts_at, created_at) DESC`
  );
}

export async function getEventById(id: string): Promise<EventRow | null> {
  const rows = await query<EventRow>(`SELECT * FROM events WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function getEventByToken(token: string): Promise<EventRow | null> {
  const rows = await query<EventRow>(
    `SELECT * FROM events WHERE rsvp_token = $1 LIMIT 1`,
    [token]
  );
  return rows[0] ?? null;
}

/* ---------------- RSVPs ---------------- */

/**
 * Record an RSVP from the public form. When an email is given, a repeat submit
 * updates that person's answer (upsert on (event_id, lower(email))); a walk-in
 * with no email is always a new row.
 */
export async function upsertRsvp(input: {
  eventId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  response: RsvpResponse;
  guests?: number | null;
  note?: string | null;
}): Promise<EventRsvp> {
  const email = input.email?.trim().toLowerCase() || null;
  const guests = Math.max(0, Math.min(20, Math.floor(input.guests ?? 0)));

  if (email) {
    const rows = await query<EventRsvp>(
      `INSERT INTO event_rsvps (event_id, name, email, phone, response, guests, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (event_id, lower(email)) WHERE email IS NOT NULL DO UPDATE SET
         name = EXCLUDED.name, phone = EXCLUDED.phone, response = EXCLUDED.response,
         guests = EXCLUDED.guests, note = EXCLUDED.note, updated_at = now()
       RETURNING *`,
      [input.eventId, input.name.trim(), email, input.phone?.trim() || null, input.response, guests, input.note?.trim() || null]
    );
    return rows[0];
  }
  const rows = await query<EventRsvp>(
    `INSERT INTO event_rsvps (event_id, name, phone, response, guests, note)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [input.eventId, input.name.trim(), input.phone?.trim() || null, input.response, guests, input.note?.trim() || null]
  );
  return rows[0];
}

export async function listRsvps(eventId: string): Promise<EventRsvp[]> {
  return query<EventRsvp>(
    `SELECT * FROM event_rsvps WHERE event_id = $1
      ORDER BY (response = 'yes') DESC, created_at ASC`,
    [eventId]
  );
}

export async function deleteRsvp(id: string): Promise<void> {
  await query(`DELETE FROM event_rsvps WHERE id = $1`, [id]);
}

export type RsvpCounts = {
  yes: number;
  no: number;
  maybe: number;
  /** Total people expected: everyone who said yes plus their extra guests. */
  headcount: number;
};

export async function getRsvpCounts(eventId: string): Promise<RsvpCounts> {
  const rows = await query<{
    yes: string;
    no: string;
    maybe: string;
    headcount: string;
  }>(
    `SELECT
        COUNT(*) FILTER (WHERE response = 'yes')   AS yes,
        COUNT(*) FILTER (WHERE response = 'no')    AS no,
        COUNT(*) FILTER (WHERE response = 'maybe') AS maybe,
        COALESCE(SUM((response = 'yes')::int * (1 + guests)), 0) AS headcount
       FROM event_rsvps WHERE event_id = $1`,
    [eventId]
  );
  const r = rows[0];
  const n = (v?: string) => Number(v ?? 0);
  return { yes: n(r?.yes), no: n(r?.no), maybe: n(r?.maybe), headcount: n(r?.headcount) };
}

/** RSVP counts for many events at once (for the list page). */
export async function getRsvpCountsByEvent(): Promise<
  Record<string, { yes: number; headcount: number }>
> {
  const rows = await query<{ event_id: string; yes: string; headcount: string }>(
    `SELECT event_id,
            COUNT(*) FILTER (WHERE response = 'yes') AS yes,
            COALESCE(SUM((response = 'yes')::int * (1 + guests)), 0) AS headcount
       FROM event_rsvps GROUP BY event_id`
  );
  const out: Record<string, { yes: number; headcount: number }> = {};
  for (const r of rows) {
    out[r.event_id] = { yes: Number(r.yes), headcount: Number(r.headcount) };
  }
  return out;
}
