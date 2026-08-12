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
  /** When set, targets the non-openers of this parent broadcast. */
  resend_of: string | null;
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
  filters: LeadSegment | null = null,
  resendOf: string | null = null
): Promise<Broadcast> {
  const rows = await query<Broadcast>(
    `INSERT INTO broadcasts (subject, body, audience, channel, filters, resend_of)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      subject,
      body,
      audience,
      channel,
      filters ? JSON.stringify(filters) : null,
      resendOf,
    ]
  );
  return rows[0];
}

/**
 * Recipients of a broadcast who did NOT open it and are still subscribed
 * (for a "resend to non-openers"). Resolved live so new opt-outs are honored.
 */
export async function getNonOpeners(parentBroadcastId: string) {
  return query<import("./leads").Lead>(
    `SELECT l.* FROM leads l
       JOIN broadcast_recipients br
         ON br.lead_id = l.id AND br.broadcast_id = $1
      WHERE br.error IS NULL
        AND br.opened_at IS NULL
        AND l.unsubscribed_at IS NULL
        AND l.consent = TRUE
        AND l.email IS NOT NULL AND l.email <> ''
      ORDER BY l.created_at ASC`,
    [parentBroadcastId]
  );
}

/** Count of current non-openers (for the composer). */
export async function countNonOpeners(
  parentBroadcastId: string
): Promise<number> {
  const rows = await query<{ n: string }>(
    `SELECT COUNT(*) AS n FROM leads l
       JOIN broadcast_recipients br
         ON br.lead_id = l.id AND br.broadcast_id = $1
      WHERE br.error IS NULL
        AND br.opened_at IS NULL
        AND l.unsubscribed_at IS NULL
        AND l.consent = TRUE
        AND l.email IS NOT NULL AND l.email <> ''`,
    [parentBroadcastId]
  );
  return Number(rows[0]?.n ?? 0);
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
  opts?: { error?: string; providerMessageId?: string }
): Promise<void> {
  await query(
    `INSERT INTO broadcast_recipients (broadcast_id, lead_id, error, provider_message_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (broadcast_id, lead_id) DO NOTHING`,
    [broadcastId, leadId, opts?.error ?? null, opts?.providerMessageId ?? null]
  );
}

/** A Resend engagement/delivery event mapped to a recipient timestamp column. */
export type EngagementEvent =
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained";

const EVENT_COLUMN: Record<EngagementEvent, string> = {
  delivered: "delivered_at",
  opened: "opened_at",
  clicked: "clicked_at",
  bounced: "bounced_at",
  complained: "complained_at",
};

/**
 * Stamp an engagement event on the recipient identified by the Resend message
 * id. Idempotent (COALESCE keeps the first timestamp). Returns the matched
 * lead_id (so the caller can suppress on bounce/complaint), or null.
 */
export async function applyEngagementEvent(
  providerMessageId: string,
  event: EngagementEvent
): Promise<string | null> {
  const col = EVENT_COLUMN[event];
  const rows = await query<{ lead_id: string }>(
    `UPDATE broadcast_recipients
        SET ${col} = COALESCE(${col}, now())
      WHERE provider_message_id = $1
      RETURNING lead_id`,
    [providerMessageId]
  );
  return rows[0]?.lead_id ?? null;
}

export type BroadcastResults = {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  failed: number;
};

/** Aggregate delivery + engagement counts for one broadcast. */
export async function getBroadcastResults(
  broadcastId: string
): Promise<BroadcastResults> {
  const rows = await query<Record<keyof BroadcastResults, string>>(
    `SELECT
        COUNT(*) FILTER (WHERE error IS NULL)          AS sent,
        COUNT(*) FILTER (WHERE delivered_at IS NOT NULL) AS delivered,
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL)  AS opened,
        COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) AS clicked,
        COUNT(*) FILTER (WHERE bounced_at IS NOT NULL) AS bounced,
        COUNT(*) FILTER (WHERE complained_at IS NOT NULL) AS complained,
        COUNT(*) FILTER (WHERE error IS NOT NULL)      AS failed
       FROM broadcast_recipients
      WHERE broadcast_id = $1`,
    [broadcastId]
  );
  const r = rows[0];
  const n = (v?: string) => Number(v ?? 0);
  return {
    sent: n(r?.sent),
    delivered: n(r?.delivered),
    opened: n(r?.opened),
    clicked: n(r?.clicked),
    bounced: n(r?.bounced),
    complained: n(r?.complained),
    failed: n(r?.failed),
  };
}

/**
 * List-wide deliverability across all email sends (for the Leads health strip).
 * Rates off this let you catch a bad list before it wrecks your reputation.
 */
export async function getDeliverabilityStats(): Promise<{
  sent: number;
  delivered: number;
  bounced: number;
  complained: number;
}> {
  const rows = await query<{
    sent: string;
    delivered: string;
    bounced: string;
    complained: string;
  }>(
    `SELECT
        COUNT(*) FILTER (WHERE error IS NULL)             AS sent,
        COUNT(*) FILTER (WHERE delivered_at IS NOT NULL)  AS delivered,
        COUNT(*) FILTER (WHERE bounced_at IS NOT NULL)    AS bounced,
        COUNT(*) FILTER (WHERE complained_at IS NOT NULL) AS complained
       FROM broadcast_recipients`
  );
  const r = rows[0];
  const n = (v?: string) => Number(v ?? 0);
  return {
    sent: n(r?.sent),
    delivered: n(r?.delivered),
    bounced: n(r?.bounced),
    complained: n(r?.complained),
  };
}

/* ---------------- Saved recipient segments ---------------- */

export type SavedSegment = {
  id: string;
  name: string;
  audience: Audience;
  filters: LeadSegment;
  created_at: string;
};

export async function listSavedSegments(): Promise<SavedSegment[]> {
  return query<SavedSegment>(
    `SELECT * FROM saved_segments ORDER BY lower(name) ASC`
  );
}

export async function createSavedSegment(
  name: string,
  audience: Audience,
  filters: LeadSegment
): Promise<SavedSegment> {
  const rows = await query<SavedSegment>(
    `INSERT INTO saved_segments (name, audience, filters)
     VALUES ($1, $2, $3) RETURNING *`,
    [name, audience, JSON.stringify(filters)]
  );
  return rows[0];
}

export async function deleteSavedSegment(id: string): Promise<void> {
  await query(`DELETE FROM saved_segments WHERE id = $1`, [id]);
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
