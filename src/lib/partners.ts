import { query } from "./db";
import {
  PARTNER_STATUSES,
  STATUS_RANK,
  type PartnerStatus,
  type PartnerTier,
  type PartnerOwner,
  type ActivityType,
  type CallOutcome,
  type ReferralOutcome,
} from "./partners-vocab";

// One import surface for callers: the vocabulary (labels, tones, enums) plus
// the DB functions below. The vocabulary lives in partners-vocab (no pg import)
// so client components can use it; this module adds the server-only queries.
export * from "./partners-vocab";

/**
 * Partners CRM data layer. Referral sources (hospitals, hospice, home health,
 * SNFs, placement agencies, faith communities, PCPs) that Joy stays in touch
 * with. Mirrors the query()/hasDatabase() conventions used by lib/leads.ts.
 * Everything here is parameterized SQL.
 */


/* ------------------------------------------------------------------ */
/* Row types                                                           */
/* ------------------------------------------------------------------ */

export type Partner = {
  id: string;
  organization: string;
  category: string;
  tier: PartnerTier | null;
  status: PartnerStatus;
  contact_name: string | null;
  contact_role: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  service_area: string | null;
  owner: PartnerOwner;
  next_action: string | null;
  next_date: string | null;
  notes: string | null;
  source: string | null;
  last_touch_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PartnerActivity = {
  id: string;
  partner_id: string;
  type: ActivityType;
  note: string | null;
  call_outcome: CallOutcome | null;
  call_duration: string | null;
  status_change: PartnerStatus | null;
  logged_by: string | null;
  logged_at: string;
};

export type PartnerReminder = {
  id: string;
  partner_id: string;
  label: string;
  due_date: string | null;
  done: boolean;
  done_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type PartnerReferral = {
  id: string;
  partner_id: string;
  occurred_on: string;
  family_label: string | null;
  outcome: ReferralOutcome;
  notes: string | null;
  created_at: string;
};

/* ------------------------------------------------------------------ */
/* Filters + list                                                      */
/* ------------------------------------------------------------------ */

export type PartnerFilters = {
  q?: string;
  status?: string;
  tier?: string;
  category?: string;
  owner?: string;
  due?: boolean; // due this week (next_date <= end of this week, not closed)
};

/** Build the shared WHERE clause + params from filters. */
function buildWhere(f: PartnerFilters): { sql: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  const add = (cond: string, value: unknown) => {
    params.push(value);
    clauses.push(cond.replace("$?", `$${params.length}`));
  };

  if (f.q && f.q.trim()) {
    add(
      "(organization ILIKE $? OR contact_name ILIKE $? OR contact_role ILIKE $?)".replaceAll(
        "$?",
        "$?"
      ),
      `%${f.q.trim()}%`
    );
    // The helper only substitutes one placeholder; do the OR search manually.
    clauses.pop();
    params.pop();
    params.push(`%${f.q.trim()}%`);
    const p = `$${params.length}`;
    clauses.push(`(organization ILIKE ${p} OR contact_name ILIKE ${p} OR contact_role ILIKE ${p})`);
  }
  if (f.status && f.status !== "all") add("status = $?", f.status);
  if (f.tier && f.tier !== "all") add("tier = $?", f.tier);
  if (f.category && f.category !== "all") add("category = $?", f.category);
  if (f.owner && f.owner !== "all") add("owner = $?", f.owner);
  if (f.due) {
    // Due this week = has a next_date on or before Sunday of the current week
    // (Postgres week starts Monday), and not closed. Includes overdue.
    clauses.push(
      "next_date IS NOT NULL AND next_date <= (date_trunc('week', current_date)::date + 6) AND status <> 'closed'"
    );
  }

  const sql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return { sql, params };
}

/**
 * List partners for the given filters, work-queue ordered: soonest next_date
 * first (nulls last), then most recently touched, then name. Closed partners
 * are hidden unless the status filter explicitly asks for them.
 */
export async function listPartners(f: PartnerFilters): Promise<Partner[]> {
  const filters: PartnerFilters = { ...f };
  // Default views hide closed partners (they stay queryable via the filter).
  const hideClosed = !filters.status || filters.status === "all";
  const { sql, params } = buildWhere(filters);
  const closedClause = hideClosed
    ? sql
      ? `${sql} AND status <> 'closed'`
      : "WHERE status <> 'closed'"
    : sql;
  return query<Partner>(
    `SELECT * FROM partners
      ${closedClause}
      ORDER BY (next_date IS NULL), next_date ASC, last_touch_at DESC NULLS LAST, organization ASC`,
    params
  );
}

/** Just the ordered ids for the current filter (detail prev/next pagination). */
export async function listPartnerIds(f: PartnerFilters): Promise<string[]> {
  const rows = await listPartners(f);
  return rows.map((r) => r.id);
}

export async function getPartner(id: string): Promise<Partner | null> {
  const rows = await query<Partner>(`SELECT * FROM partners WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

export type PartnerStats = {
  intros: number; // progressed past Attempted (connected .. active_partner)
  tours: number; // referral tours booked
  admissions: number; // referral admissions this quarter
};

export async function getPartnerStats(): Promise<PartnerStats> {
  const pastAttempted = PARTNER_STATUSES.filter((s) => STATUS_RANK[s] > 2);
  const [intros] = await query<{ n: string }>(
    `SELECT count(*)::int AS n FROM partners WHERE status = ANY($1)`,
    [pastAttempted]
  );
  const [tours] = await query<{ n: string }>(
    `SELECT count(*)::int AS n FROM partner_referrals WHERE outcome = 'tour'`
  );
  const [admissions] = await query<{ n: string }>(
    `SELECT count(*)::int AS n FROM partner_referrals
      WHERE outcome = 'admitted'
        AND occurred_on >= date_trunc('quarter', current_date)::date`
  );
  return {
    intros: Number(intros?.n ?? 0),
    tours: Number(tours?.n ?? 0),
    admissions: Number(admissions?.n ?? 0),
  };
}

/** How many partners are due this week (for the nav badge + list heading). */
export async function countDueThisWeek(): Promise<number> {
  const [row] = await query<{ n: string }>(
    `SELECT count(*)::int AS n FROM partners
      WHERE next_date IS NOT NULL
        AND next_date <= (date_trunc('week', current_date)::date + 6)
        AND status <> 'closed'`
  );
  return Number(row?.n ?? 0);
}


/* ------------------------------------------------------------------ */
/* Create / update                                                     */
/* ------------------------------------------------------------------ */

export type PartnerInput = {
  organization: string;
  category?: string;
  tier?: PartnerTier | null;
  status?: PartnerStatus;
  contact_name?: string | null;
  contact_role?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  service_area?: string | null;
  owner?: PartnerOwner;
  next_action?: string | null;
  next_date?: string | null;
  notes?: string | null;
  source?: string | null;
};

export async function insertPartner(input: PartnerInput): Promise<Partner> {
  const rows = await query<Partner>(
    `INSERT INTO partners
       (organization, category, tier, status, contact_name, contact_role,
        phone, email, website, service_area, owner, next_action, next_date,
        notes, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [
      input.organization.trim(),
      input.category ?? "other",
      input.tier ?? null,
      input.status ?? "not_contacted",
      input.contact_name ?? null,
      input.contact_role ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.website ?? null,
      input.service_area ?? null,
      input.owner ?? "both",
      input.next_action ?? null,
      input.next_date || null,
      input.notes ?? null,
      input.source ?? null,
    ]
  );
  return rows[0];
}

export async function updatePartner(
  id: string,
  input: PartnerInput
): Promise<void> {
  await query(
    `UPDATE partners SET
       organization = $2, category = $3, tier = $4, status = $5,
       contact_name = $6, contact_role = $7, phone = $8, email = $9,
       website = $10, service_area = $11, owner = $12, next_action = $13,
       next_date = $14, notes = $15, updated_at = now()
     WHERE id = $1`,
    [
      id,
      input.organization.trim(),
      input.category ?? "other",
      input.tier ?? null,
      input.status ?? "not_contacted",
      input.contact_name ?? null,
      input.contact_role ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.website ?? null,
      input.service_area ?? null,
      input.owner ?? "both",
      input.next_action ?? null,
      input.next_date || null,
      input.notes ?? null,
    ]
  );
}

/** Update a single sidebar field (owner, next_action/next_date, notes). */
export async function patchPartner(
  id: string,
  fields: Partial<
    Pick<Partner, "owner" | "next_action" | "next_date" | "notes" | "status">
  >
): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [id];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    params.push(key === "next_date" ? value || null : value);
    sets.push(`${key} = $${params.length}`);
  }
  if (!sets.length) return;
  sets.push("updated_at = now()");
  await query(`UPDATE partners SET ${sets.join(", ")} WHERE id = $1`, params);
}

/** Hide (soft close) a partner: status -> closed, dropped from default lists. */
export async function markPartnerClosed(id: string): Promise<void> {
  await query(
    `UPDATE partners SET status = 'closed', updated_at = now() WHERE id = $1`,
    [id]
  );
}

/* ------------------------------------------------------------------ */
/* Activity log (touches)                                              */
/* ------------------------------------------------------------------ */

export type LogActivityInput = {
  partnerId: string;
  type: ActivityType;
  note?: string | null;
  callOutcome?: CallOutcome | null;
  callDuration?: string | null;
  loggedBy?: string | null;
  // Optional: only applied when the operator actually set them.
  status?: PartnerStatus | null;
  nextAction?: string | null;
  nextDate?: string | null;
};

/**
 * Record a touch. Always bumps last_touch_at. Only when status / next_action /
 * next_date were actually provided are those partner fields updated (and the
 * status change is stamped on the activity row for the timeline).
 */
export async function logActivity(input: LogActivityInput): Promise<PartnerActivity> {
  const statusChange = input.status ?? null;
  const rows = await query<PartnerActivity>(
    `INSERT INTO partner_activities
       (partner_id, type, note, call_outcome, call_duration, status_change, logged_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      input.partnerId,
      input.type,
      input.note ?? null,
      input.type === "call" ? input.callOutcome ?? null : null,
      input.type === "call" ? input.callDuration ?? null : null,
      statusChange,
      input.loggedBy ?? null,
    ]
  );

  // Fold optional updates into one partner UPDATE.
  const sets: string[] = ["last_touch_at = now()", "updated_at = now()"];
  const params: unknown[] = [input.partnerId];
  if (statusChange) {
    params.push(statusChange);
    sets.push(`status = $${params.length}`);
  }
  if (input.nextAction !== undefined && input.nextAction !== null) {
    params.push(input.nextAction);
    sets.push(`next_action = $${params.length}`);
  }
  if (input.nextDate !== undefined && input.nextDate !== null && input.nextDate !== "") {
    params.push(input.nextDate);
    sets.push(`next_date = $${params.length}`);
  }
  await query(`UPDATE partners SET ${sets.join(", ")} WHERE id = $1`, params);

  return rows[0];
}

export async function getActivities(partnerId: string): Promise<PartnerActivity[]> {
  return query<PartnerActivity>(
    `SELECT * FROM partner_activities WHERE partner_id = $1 ORDER BY logged_at DESC`,
    [partnerId]
  );
}

/* ------------------------------------------------------------------ */
/* Reminders                                                           */
/* ------------------------------------------------------------------ */

export async function getReminders(partnerId: string): Promise<PartnerReminder[]> {
  return query<PartnerReminder>(
    `SELECT * FROM partner_reminders
      WHERE partner_id = $1
      ORDER BY done ASC, (due_date IS NULL), due_date ASC, created_at DESC`,
    [partnerId]
  );
}

export async function addReminder(
  partnerId: string,
  label: string,
  dueDate: string | null,
  createdBy?: string | null
): Promise<PartnerReminder> {
  const rows = await query<PartnerReminder>(
    `INSERT INTO partner_reminders (partner_id, label, due_date, created_by)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [partnerId, label.trim(), dueDate || null, createdBy ?? null]
  );
  return rows[0];
}

export async function toggleReminder(id: string, done: boolean): Promise<void> {
  await query(
    `UPDATE partner_reminders
        SET done = $2, done_at = CASE WHEN $2 THEN now() ELSE NULL END
      WHERE id = $1`,
    [id, done]
  );
}

export async function deleteReminder(id: string): Promise<void> {
  await query(`DELETE FROM partner_reminders WHERE id = $1`, [id]);
}

/* ------------------------------------------------------------------ */
/* Referrals                                                           */
/* ------------------------------------------------------------------ */

export async function getReferrals(partnerId: string): Promise<PartnerReferral[]> {
  return query<PartnerReferral>(
    `SELECT * FROM partner_referrals WHERE partner_id = $1 ORDER BY occurred_on DESC`,
    [partnerId]
  );
}

export async function addReferral(input: {
  partnerId: string;
  occurredOn?: string | null;
  familyLabel?: string | null;
  outcome?: ReferralOutcome;
  notes?: string | null;
}): Promise<PartnerReferral> {
  const rows = await query<PartnerReferral>(
    `INSERT INTO partner_referrals (partner_id, occurred_on, family_label, outcome, notes)
     VALUES ($1, COALESCE($2::date, current_date), $3, $4, $5)
     RETURNING *`,
    [
      input.partnerId,
      input.occurredOn || null,
      input.familyLabel ?? null,
      input.outcome ?? "inquiry",
      input.notes ?? null,
    ]
  );
  return rows[0];
}

/* ------------------------------------------------------------------ */
/* Import (CSV) helpers                                                */
/* ------------------------------------------------------------------ */

/** Case-insensitive dedupe by organization name. */
export async function partnerOrgExists(organization: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM partners WHERE lower(organization) = lower($1) LIMIT 1`,
    [organization.trim()]
  );
  return rows.length > 0;
}
