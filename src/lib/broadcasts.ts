import { query } from "./db";
import { createMessage } from "./messages";

import type { Audience, LeadSegment } from "./leads";

export type BroadcastStatus = "draft" | "scheduled" | "sending" | "sent";
export type BroadcastChannel = "email" | "sms";
export type BroadcastBodyFormat = "markdown" | "html" | "html_standalone";
export type EventEmailKind = "invite" | "reminder" | "update";

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
  /** The reusable Message this Send dispatches (the once-per-Message key). */
  message_id: string | null;
  /** How `body` is authored: Markdown (letter templates) or designed HTML. */
  body_format: BroadcastBodyFormat;
  /** Studio structured model (EmailModel JSON) when composed in the studio; null otherwise. */
  model_json: unknown | null;
  /** Event emails jump ahead of throttled marketing (sent in full, immediately). */
  priority: boolean;
  /** The event this Send was written for, when it came from the Event Studio. */
  event_id: string | null;
  /** Which event email this is: invite | reminder | update (null otherwise). */
  event_kind: EventEmailKind | null;
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
  resendOf: string | null = null,
  opts?: {
    messageId?: string | null;
    createdBy?: string | null;
    format?: BroadcastBodyFormat;
    modelJson?: unknown | null;
    priority?: boolean;
    eventId?: string | null;
    eventKind?: EventEmailKind | null;
  }
): Promise<Broadcast> {
  // Every Send points at a Message. When no Message is supplied, this compose
  // gets a fresh one (its own once-per-Message scope). Reusing a messageId
  // makes this Send subject to the earlier Send's dedupe (same content, skip
  // whoever already received it); duplicating instead yields a new id.
  const messageId =
    opts?.messageId ??
    (
      await createMessage({ subject, body, createdBy: opts?.createdBy ?? null })
    ).id;

  const rows = await query<Broadcast>(
    `INSERT INTO broadcasts (subject, body, audience, channel, filters, resend_of, message_id, body_format, model_json, priority, event_id, event_kind)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [
      subject,
      body,
      audience,
      channel,
      filters ? JSON.stringify(filters) : null,
      resendOf,
      messageId,
      opts?.format ?? "markdown",
      opts?.modelJson != null ? JSON.stringify(opts.modelJson) : null,
      opts?.priority ?? false,
      opts?.eventId ?? null,
      opts?.eventKind ?? null,
    ]
  );
  return rows[0];
}

/**
 * What actually went out for an event: the answer to "did invites go out?",
 * which the event's own status cannot give (publishing only makes the RSVP
 * page public). `invitePending` is an invite composed but not yet sent, so
 * "written" reads differently from "gone out".
 */
export type EventEmailStats = {
  /** People the invite reached, summed across every invite Send. */
  invitesSent: number;
  /** When the most recent invite finished sending. */
  lastInviteAt: string | null;
  /** An invite sitting in the studio (draft/scheduled/sending), not yet out. */
  invitePending: boolean;
  /** Reminders and updates that have gone out for this event. */
  followUpsSent: number;
};

const NO_EVENT_EMAILS: EventEmailStats = {
  invitesSent: 0,
  lastInviteAt: null,
  invitePending: false,
  followUpsSent: 0,
};

type EventEmailStatsRow = {
  event_id: string;
  invites_sent: string;
  last_invite_at: string | null;
  invites_pending: string;
  follow_ups_sent: string;
};

// Counted from the per-recipient rows rather than broadcasts.sent_count: those
// rows are written as each email goes out, so a send still working through its
// list (or a resend to non-openers) reports the people actually reached, each
// counted once. Follow-ups are counted as emails, not people.
const EVENT_EMAIL_STATS_SQL = `
  SELECT b.event_id,
         COUNT(DISTINCT br.lead_id) FILTER (
           WHERE b.event_kind = 'invite' AND br.error IS NULL)   AS invites_sent,
         MAX(br.sent_at) FILTER (
           WHERE b.event_kind = 'invite' AND br.error IS NULL)   AS last_invite_at,
         COUNT(DISTINCT b.id) FILTER (
           WHERE b.event_kind = 'invite'
             AND b.status IN ('draft', 'scheduled', 'sending'))  AS invites_pending,
         COUNT(DISTINCT b.id) FILTER (
           WHERE b.event_kind IN ('reminder', 'update')
             AND b.status = 'sent')                              AS follow_ups_sent
    FROM broadcasts b
    LEFT JOIN broadcast_recipients br ON br.broadcast_id = b.id
   WHERE b.event_id IS NOT NULL`;

function toStats(row: EventEmailStatsRow | undefined): EventEmailStats {
  if (!row) return NO_EVENT_EMAILS;
  return {
    invitesSent: Number(row.invites_sent),
    lastInviteAt: row.last_invite_at,
    invitePending: Number(row.invites_pending) > 0,
    followUpsSent: Number(row.follow_ups_sent),
  };
}

/** Email stats for every event at once (the events list). */
export async function getEventEmailStatsByEvent(): Promise<
  Record<string, EventEmailStats>
> {
  const rows = await query<EventEmailStatsRow>(
    `${EVENT_EMAIL_STATS_SQL} GROUP BY b.event_id`
  );
  const out: Record<string, EventEmailStats> = {};
  for (const r of rows) out[r.event_id] = toStats(r);
  return out;
}

/** Email stats for one event (the Event Studio rail). */
export async function getEventEmailStats(
  eventId: string
): Promise<EventEmailStats> {
  const rows = await query<EventEmailStatsRow>(
    `${EVENT_EMAIL_STATS_SQL} AND b.event_id = $1 GROUP BY b.event_id`,
    [eventId]
  );
  return toStats(rows[0]);
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
  filters: LeadSegment | null = null,
  format: BroadcastBodyFormat = "markdown",
  modelJson?: unknown | null,
  audience?: Audience | null
): Promise<Broadcast | null> {
  const rows = await query<Broadcast>(
    `UPDATE broadcasts SET subject = $2, body = $3, filters = $4, body_format = $5,
       model_json = COALESCE($6, model_json),
       audience = COALESCE($7, audience),
       updated_at = now()
     WHERE id = $1 AND status IN ('draft','scheduled') RETURNING *`,
    [
      id,
      subject,
      body,
      filters ? JSON.stringify(filters) : null,
      format,
      modelJson != null ? JSON.stringify(modelJson) : null,
      audience ?? null,
    ]
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
  // Immediate sends (event priority + the family list) first, then by schedule,
  // so they jump the throttled marketing (leads) queue.
  return query<Broadcast>(
    `SELECT * FROM broadcasts
      WHERE status = 'scheduled' AND channel = 'email' AND scheduled_at <= now()
      ORDER BY (priority OR audience = 'families') DESC, scheduled_at ASC`
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

/**
 * Record a per-recipient send. Idempotent both within a broadcast (PK) and
 * across every Send of the same Message (the (message_id, lead_id) unique
 * index) — ON CONFLICT DO NOTHING catches either, so the once-per-Message rule
 * holds even under a race.
 */
export async function recordRecipient(
  broadcastId: string,
  leadId: string,
  opts?: { error?: string; providerMessageId?: string; messageId?: string | null }
): Promise<void> {
  await query(
    `INSERT INTO broadcast_recipients (broadcast_id, lead_id, error, provider_message_id, message_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT DO NOTHING`,
    [
      broadcastId,
      leadId,
      opts?.error ?? null,
      opts?.providerMessageId ?? null,
      opts?.messageId ?? null,
    ]
  );
}

/**
 * Lead ids that have ALREADY received this Message (across any Send of it), so
 * a re-send skips them. This is the once-per-Message rule at read time; the
 * unique index is the write-time backstop.
 */
export async function alreadyReceivedLeadIds(
  messageId: string
): Promise<Set<string>> {
  const rows = await query<{ lead_id: string }>(
    `SELECT DISTINCT lead_id FROM broadcast_recipients WHERE message_id = $1`,
    [messageId]
  );
  return new Set(rows.map((r) => r.lead_id));
}

/** How many contacts already received this Message (for the recipient panel). */
export async function countAlreadyReceived(messageId: string): Promise<number> {
  const rows = await query<{ n: string }>(
    `SELECT COUNT(DISTINCT lead_id) AS n FROM broadcast_recipients WHERE message_id = $1`,
    [messageId]
  );
  return Number(rows[0]?.n ?? 0);
}

/** One email this contact was sent (for the lead detail history). */
export type LeadEmailRecord = {
  broadcast_id: string;
  subject: string;
  channel: string;
  sent_at: string;
  error: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
};

/**
 * Every email sent to one lead, newest first. Drives the "Emails sent" panel on
 * the lead detail page and lets the operator see recent contact at a glance.
 */
export async function getLeadEmailHistory(
  leadId: string
): Promise<LeadEmailRecord[]> {
  return query<LeadEmailRecord>(
    `SELECT b.id AS broadcast_id, b.subject, b.channel,
            br.sent_at, br.error, br.opened_at, br.clicked_at,
            br.bounced_at, br.complained_at
       FROM broadcast_recipients br
       JOIN broadcasts b ON b.id = br.broadcast_id
      WHERE br.lead_id = $1
      ORDER BY br.sent_at DESC`,
    [leadId]
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
