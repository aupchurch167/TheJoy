import { query } from "./db";

export type LeadInput = {
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  source?: string;
  consent?: boolean;
  // 'active' enrolls the lead in the nurture drip (homepage default).
  // 'completed' skips the drip (e.g. TalkFurther leads have their own sequence).
  dripStatus?: DripStatus;
};

export type LeadStage = "new" | "toured" | "moved_in" | "lost";
export type DripStatus = "active" | "completed" | "paused";
export type Audience = "leads" | "families";

/**
 * The `leads` table doubles as the subscribers table. `audience` separates
 * prospective families ('leads') from current residents' families ('families').
 */
export type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string;
  audience: Audience;
  consent: boolean;
  unsubscribe_token: string;
  unsubscribed_at: string | null;
  created_at: string;
  stage: LeadStage;
  stage_updated_at: string | null;
  drip_step: number;
  drip_status: DripStatus;
  last_drip_at: string | null;
  // Family directory fields (families audience).
  resident_name: string | null;
  relation: string | null;
  active: boolean;
};

/** Insert a lead and return the stored row (including its unsubscribe token). */
export async function insertLead(input: LeadInput): Promise<Lead> {
  const rows = await query<Lead>(
    `INSERT INTO leads (name, email, phone, message, source, consent, drip_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.name,
      input.email.toLowerCase(),
      input.phone ?? null,
      input.message ?? null,
      input.source ?? "homepage_form",
      input.consent ?? true,
      input.dripStatus ?? "active",
    ]
  );
  return rows[0];
}

/** True if a lead already exists for this source + email (webhook dedupe). */
export async function leadExists(
  source: string,
  email: string
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM leads WHERE source = $1 AND lower(email) = lower($2) LIMIT 1`,
    [source, email]
  );
  return rows.length > 0;
}

/** Mark a lead unsubscribed by its token. Returns true if a row was updated. */
export async function unsubscribeByToken(token: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `UPDATE leads
       SET unsubscribed_at = now(), drip_status = 'paused'
     WHERE unsubscribe_token = $1
       AND unsubscribed_at IS NULL
     RETURNING id`,
    [token]
  );
  return rows.length > 0;
}

/* ---------------- Phase 3: lifecycle + drip + reporting ---------------- */

export async function getAllLeads(source?: string): Promise<Lead[]> {
  return query<Lead>(
    `SELECT * FROM leads
      WHERE audience = 'leads'
      ${source ? "AND source = $1" : ""}
      ORDER BY created_at DESC`,
    source ? [source] : []
  );
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const rows = await query<Lead>(`SELECT * FROM leads WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

/** Update a lead's lifecycle stage (new/toured/moved_in/lost). */
export async function setLeadStage(id: string, stage: LeadStage): Promise<void> {
  await query(
    `UPDATE leads SET stage = $2, stage_updated_at = now() WHERE id = $1`,
    [id, stage]
  );
}

/** Advance the drip position after a step is sent. */
export async function advanceDrip(
  id: string,
  step: number,
  status: DripStatus
): Promise<void> {
  await query(
    `UPDATE leads
       SET drip_step = $2, drip_status = $3, last_drip_at = now()
     WHERE id = $1`,
    [id, step, status]
  );
}

/**
 * Leads whose next drip step is due: active, opted-in, and whose last drip was
 * at least `minHoursSinceLast` hours ago (or never). The caller decides, per
 * lead's current step, whether the specific step's delay has elapsed.
 */
export async function getDripCandidates(): Promise<Lead[]> {
  // Only the prospective-families audience gets the nurture drip.
  return query<Lead>(
    `SELECT * FROM leads
      WHERE audience = 'leads'
        AND drip_status = 'active'
        AND unsubscribed_at IS NULL
        AND consent = TRUE
      ORDER BY created_at ASC`
  );
}

/**
 * Active, opted-in subscribers for a given audience (broadcast recipients).
 * Rows without an email (phone-only family contacts) are skipped, and for the
 * families audience only contacts of currently-active residents are included.
 */
export async function getSubscribedByAudience(
  audience: Audience
): Promise<Lead[]> {
  return query<Lead>(
    `SELECT * FROM leads
      WHERE audience = $1
        AND unsubscribed_at IS NULL
        AND consent = TRUE
        AND email IS NOT NULL AND email <> ''
        AND (audience <> 'families' OR active = TRUE)
      ORDER BY created_at ASC`,
    [audience]
  );
}

/* ---------------- Phase 4: family members (families audience) ---------------- */

export type FamilyMemberInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  residentName?: string | null;
  relation?: string | null;
  active?: boolean;
  source?: string;
  /** Set to unsubscribe on insert (e.g. imported "do not contact"). */
  unsubscribed?: boolean;
};

export async function insertFamilyMember(
  input: FamilyMemberInput
): Promise<Lead> {
  const email = input.email?.trim() ? input.email.trim().toLowerCase() : null;
  const rows = await query<Lead>(
    `INSERT INTO leads
       (name, email, phone, source, audience, consent, drip_status,
        resident_name, relation, active, unsubscribed_at)
     VALUES ($1, $2, $3, $4, 'families', TRUE, 'completed', $5, $6, $7, $8)
     RETURNING *`,
    [
      input.name,
      email,
      input.phone?.trim() || null,
      input.source ?? "family_add",
      input.residentName?.trim() || null,
      input.relation?.trim() || null,
      input.active ?? true,
      input.unsubscribed ? new Date().toISOString() : null,
    ]
  );
  return rows[0];
}

export async function getFamilyMembers(): Promise<Lead[]> {
  // Active residents first, then grouped by resident, then by contact name.
  return query<Lead>(
    `SELECT * FROM leads
      WHERE audience = 'families'
      ORDER BY active DESC,
               lower(coalesce(resident_name, '')) ASC,
               lower(name) ASC`
  );
}

/** Toggle whether a family member's resident is currently active. */
export async function setFamilyActive(
  id: string,
  active: boolean
): Promise<void> {
  await query(`UPDATE leads SET active = $2 WHERE id = $1`, [id, active]);
}

/** Remove a subscriber row (used to remove a family member). */
export async function deleteSubscriber(id: string): Promise<void> {
  await query(`DELETE FROM leads WHERE id = $1`, [id]);
}

export async function familyEmailExists(email: string): Promise<boolean> {
  if (!email.trim()) return false;
  const rows = await query<{ id: string }>(
    `SELECT id FROM leads WHERE audience = 'families' AND lower(email) = lower($1)`,
    [email]
  );
  return rows.length > 0;
}

/** Dedupe by resident + contact name (for the bulk import, which lacks email). */
export async function familyContactExists(
  residentName: string,
  name: string
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM leads
      WHERE audience = 'families'
        AND lower(coalesce(resident_name,'')) = lower($1)
        AND lower(name) = lower($2)
      LIMIT 1`,
    [residentName, name]
  );
  return rows.length > 0;
}

export type SourceReportRow = {
  source: string;
  total: number;
  toured: number;
  moved_in: number;
  lost: number;
};

/** Source attribution: leads grouped by source with lifecycle counts. */
export async function getSourceReport(): Promise<SourceReportRow[]> {
  const rows = await query<{
    source: string;
    total: string;
    toured: string;
    moved_in: string;
    lost: string;
  }>(
    `SELECT source,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE stage IN ('toured','moved_in')) AS toured,
            COUNT(*) FILTER (WHERE stage = 'moved_in') AS moved_in,
            COUNT(*) FILTER (WHERE stage = 'lost') AS lost
       FROM leads
      WHERE audience = 'leads'
      GROUP BY source
      ORDER BY total DESC`
  );
  return rows.map((r) => ({
    source: r.source,
    total: Number(r.total),
    toured: Number(r.toured),
    moved_in: Number(r.moved_in),
    lost: Number(r.lost),
  }));
}
