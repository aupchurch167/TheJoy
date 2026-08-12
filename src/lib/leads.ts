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
  // SMS (text blast) consent + opt-out.
  sms_consent: boolean;
  sms_opt_out_at: string | null;
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

/** True if any leads-audience contact already has this email (import dedupe). */
export async function leadEmailExists(email: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM leads WHERE audience = 'leads' AND lower(email) = lower($1) LIMIT 1`,
    [email]
  );
  return rows.length > 0;
}

/**
 * Insert an old (pre-website) lead from the CSV import: audience 'leads',
 * drip skipped ('completed'), optional original created_at. `consent` is FALSE
 * when the batch is held out for a re-permission email.
 */
export async function insertImportedLead(input: {
  name?: string | null;
  email: string;
  phone?: string | null;
  message?: string | null;
  source: string;
  consent: boolean;
  createdAt?: string | null;
}): Promise<void> {
  await query(
    `INSERT INTO leads
       (name, email, phone, message, source, audience, consent, drip_status,
        created_at)
     VALUES ($1, $2, $3, $4, $5, 'leads', $6, 'completed',
             COALESCE($7::timestamptz, now()))`,
    [
      // name is NOT NULL: fall back to the email's local part.
      input.name?.trim() || input.email.split("@")[0] || input.email,
      input.email.toLowerCase(),
      input.phone ?? null,
      input.message ?? null,
      input.source,
      input.consent,
      input.createdAt ?? null,
    ]
  );
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

/** Optional created_at bounds (ISO strings) for date-range filtering. */
export type DateRange = { from?: string | null; to?: string | null };

/**
 * Old leads bulk-imported from before the website (via scripts/import-leads.mjs)
 * carry a source starting with this prefix. The leads list and attribution
 * report exclude them by default so website metrics are not muddied; they are
 * still full subscribers and reachable by broadcasts.
 */
export const IMPORT_SOURCE_PREFIX = "import";

export async function getAllLeads(
  opts: { source?: string; excludeImports?: boolean } & DateRange = {}
): Promise<Lead[]> {
  const conds = ["audience = 'leads'"];
  const params: unknown[] = [];
  if (opts.source) {
    params.push(opts.source);
    conds.push(`source = $${params.length}`);
  }
  if (opts.excludeImports) {
    conds.push(`source NOT LIKE '${IMPORT_SOURCE_PREFIX}%'`);
  }
  if (opts.from) {
    params.push(opts.from);
    conds.push(`created_at >= $${params.length}`);
  }
  if (opts.to) {
    params.push(opts.to);
    conds.push(`created_at <= $${params.length}`);
  }
  return query<Lead>(
    `SELECT * FROM leads
      WHERE ${conds.join(" AND ")}
      ORDER BY created_at DESC`,
    params
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

/** Toggle a family contact's SMS consent (opt them in/out of text blasts). */
export async function setFamilySmsConsent(
  id: string,
  consent: boolean
): Promise<void> {
  await query(`UPDATE leads SET sms_consent = $2 WHERE id = $1`, [id, consent]);
}

/** Mark a contact opted out of texts (e.g. they replied STOP). */
export async function markSmsOptOut(id: string): Promise<void> {
  await query(
    `UPDATE leads SET sms_opt_out_at = now(), sms_consent = FALSE WHERE id = $1`,
    [id]
  );
}

/**
 * Text-blast recipients: family contacts who are active, have a phone, have
 * given SMS consent, and have not opted out.
 */
export async function getSmsRecipients(): Promise<Lead[]> {
  return query<Lead>(
    `SELECT * FROM leads
      WHERE audience = 'families'
        AND active = TRUE
        AND sms_consent = TRUE
        AND sms_opt_out_at IS NULL
        AND phone IS NOT NULL AND phone <> ''
      ORDER BY lower(coalesce(resident_name,'')) ASC`
  );
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
export async function getSourceReport(
  range: DateRange & { excludeImports?: boolean } = {}
): Promise<SourceReportRow[]> {
  const conds = ["audience = 'leads'"];
  const params: unknown[] = [];
  if (range.from) {
    params.push(range.from);
    conds.push(`created_at >= $${params.length}`);
  }
  if (range.to) {
    params.push(range.to);
    conds.push(`created_at <= $${params.length}`);
  }
  if (range.excludeImports) {
    conds.push(`source NOT LIKE '${IMPORT_SOURCE_PREFIX}%'`);
  }
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
      WHERE ${conds.join(" AND ")}
      GROUP BY source
      ORDER BY total DESC`,
    params
  );
  return rows.map((r) => ({
    source: r.source,
    total: Number(r.total),
    toured: Number(r.toured),
    moved_in: Number(r.moved_in),
    lost: Number(r.lost),
  }));
}
