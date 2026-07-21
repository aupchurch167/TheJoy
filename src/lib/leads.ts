import { query } from "./db";

export type LeadInput = {
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  source?: string;
  consent?: boolean;
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
  email: string;
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
};

/** Insert a lead and return the stored row (including its unsubscribe token). */
export async function insertLead(input: LeadInput): Promise<Lead> {
  const rows = await query<Lead>(
    `INSERT INTO leads (name, email, phone, message, source, consent)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.name,
      input.email.toLowerCase(),
      input.phone ?? null,
      input.message ?? null,
      input.source ?? "homepage_form",
      input.consent ?? true,
    ]
  );
  return rows[0];
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

/** Active, opted-in subscribers for a given audience (broadcast recipients). */
export async function getSubscribedByAudience(
  audience: Audience
): Promise<Lead[]> {
  return query<Lead>(
    `SELECT * FROM leads
      WHERE audience = $1 AND unsubscribed_at IS NULL AND consent = TRUE
      ORDER BY created_at ASC`,
    [audience]
  );
}

/* ---------------- Phase 4: family members (families audience) ---------------- */

export async function insertFamilyMember(
  name: string,
  email: string
): Promise<Lead> {
  const rows = await query<Lead>(
    `INSERT INTO leads (name, email, source, audience, consent, drip_status)
     VALUES ($1, $2, 'family_add', 'families', TRUE, 'completed')
     RETURNING *`,
    [name, email.toLowerCase()]
  );
  return rows[0];
}

export async function getFamilyMembers(): Promise<Lead[]> {
  return query<Lead>(
    `SELECT * FROM leads WHERE audience = 'families' ORDER BY created_at DESC`
  );
}

/** Remove a subscriber row (used to remove a family member). */
export async function deleteSubscriber(id: string): Promise<void> {
  await query(`DELETE FROM leads WHERE id = $1`, [id]);
}

export async function familyEmailExists(email: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM leads WHERE audience = 'families' AND lower(email) = lower($1)`,
    [email]
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
