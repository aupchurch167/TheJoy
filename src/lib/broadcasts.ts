import { query } from "./db";

import type { Audience, LeadSegment } from "./leads";

export type BroadcastStatus = "draft" | "scheduled" | "sending" | "sent";
export type BroadcastChannel = "email" | "sms";

export type Broadcast = {
  id: string;
  subject: string;
  body: string;
  audience: Audience;
  channel: BroadcastChannel;
  status: BroadcastStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  sent_count: number;
  /** Recipient segment within the audience; null = the whole audience. */
  filters: LeadSegment | null;
  created_at: string;
  updated_at: string;
};

export async function getAllBroadcasts(): Promise<Broadcast[]> {
  return query<Broadcast>(`SELECT * FROM broadcasts ORDER BY updated_at DESC`);
}

export async function getBroadcastById(id: string): Promise<Broadcast | null> {
  const rows = await query<Broadcast>(`SELECT * FROM broadcasts WHERE id = $1`, [
    id,
  ]);
  return rows[0] ?? null;
}

export async function createBroadcast(
  subject: string,
  body: string,
  audience: Audience = "leads",
  channel: BroadcastChannel = "email",
  filters: LeadSegment | null = null
): Promise<Broadcast> {
  const rows = await query<Broadcast>(
    `INSERT INTO broadcasts (subject, body, audience, channel, filters)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [subject, body, audience, channel, filters ? JSON.stringify(filters) : null]
  );
  return rows[0];
}

/** SMS text blasts, most recent first (for the Texts page). */
export async function getSmsBroadcasts(): Promise<Broadcast[]> {
  return query<Broadcast>(
    `SELECT * FROM broadcasts WHERE channel = 'sms' ORDER BY created_at DESC`
  );
}

export async function updateBroadcast(
  id: string,
  subject: string,
  body: string,
  filters: LeadSegment | null = null
): Promise<Broadcast | null> {
  const rows = await query<Broadcast>(
    `UPDATE broadcasts SET subject = $2, body = $3, filters = $4, updated_at = now()
     WHERE id = $1 AND status IN ('draft','scheduled') RETURNING *`,
    [id, subject, body, filters ? JSON.stringify(filters) : null]
  );
  return rows[0] ?? null;
}

/** Move a broadcast to scheduled (send-now = scheduled_at now). */
export async function scheduleBroadcast(
  id: string,
  scheduledAt: string
): Promise<void> {
  await query(
    `UPDATE broadcasts
       SET status = 'scheduled', scheduled_at = $2, updated_at = now()
     WHERE id = $1 AND status IN ('draft','scheduled')`,
    [id, scheduledAt]
  );
}

export async function deleteBroadcast(id: string): Promise<void> {
  await query(`DELETE FROM broadcasts WHERE id = $1 AND status <> 'sent'`, [id]);
}

/**
 * Email broadcasts due to send (scheduled and past their time). SMS blasts send
 * immediately from the admin action, so the cron only handles email.
 */
export async function getDueBroadcasts(): Promise<Broadcast[]> {
  return query<Broadcast>(
    `SELECT * FROM broadcasts
      WHERE status = 'scheduled' AND channel = 'email' AND scheduled_at <= now()
      ORDER BY scheduled_at ASC`
  );
}

export async function markBroadcastSending(id: string): Promise<boolean> {
  // Atomic claim so two cron runs can't send the same broadcast.
  const rows = await query<{ id: string }>(
    `UPDATE broadcasts SET status = 'sending', updated_at = now()
     WHERE id = $1 AND status = 'scheduled' RETURNING id`,
    [id]
  );
  return rows.length > 0;
}

export async function markBroadcastSent(
  id: string,
  count: number
): Promise<void> {
  await query(
    `UPDATE broadcasts
       SET status = 'sent', sent_at = now(), sent_count = $2, updated_at = now()
     WHERE id = $1`,
    [id, count]
  );
}

/** Record a per-recipient send (idempotent via the composite PK). */
export async function recordRecipient(
  broadcastId: string,
  leadId: string,
  error?: string
): Promise<void> {
  await query(
    `INSERT INTO broadcast_recipients (broadcast_id, lead_id, error)
     VALUES ($1, $2, $3)
     ON CONFLICT (broadcast_id, lead_id) DO NOTHING`,
    [broadcastId, leadId, error ?? null]
  );
}

/** Successful sends across ALL broadcasts in the last 60 minutes (rate limit). */
export async function sentInLastHour(): Promise<number> {
  const rows = await query<{ n: string }>(
    `SELECT COUNT(*) AS n FROM broadcast_recipients
      WHERE error IS NULL AND sent_at >= now() - interval '1 hour'`
  );
  return Number(rows[0]?.n ?? 0);
}

/** Successful sends recorded for one broadcast (its running total). */
export async function sentCountForBroadcast(id: string): Promise<number> {
  const rows = await query<{ n: string }>(
    `SELECT COUNT(*) AS n FROM broadcast_recipients
      WHERE broadcast_id = $1 AND error IS NULL`,
    [id]
  );
  return Number(rows[0]?.n ?? 0);
}

/** Return a partially-sent broadcast to the queue so the next run continues it. */
export async function requeueBroadcast(id: string): Promise<void> {
  await query(
    `UPDATE broadcasts SET status = 'scheduled', updated_at = now()
      WHERE id = $1 AND status = 'sending'`,
    [id]
  );
}

/** Lead ids already sent this broadcast (so we never double-send). */
export async function alreadySentLeadIds(
  broadcastId: string
): Promise<Set<string>> {
  const rows = await query<{ lead_id: string }>(
    `SELECT lead_id FROM broadcast_recipients WHERE broadcast_id = $1`,
    [broadcastId]
  );
  return new Set(rows.map((r) => r.lead_id));
}
