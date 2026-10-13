import { query } from "./db";
import { toE164 } from "./sms";
import { suppressEmail } from "./suppression";

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

export type LeadStage = "new" | "toured" | "moved_in" | "lost" | "deceased";
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
  residentName?: string | null;
  stage?: LeadStage | null;
}): Promise<void> {
  const stage: LeadStage = input.stage ?? "new";
  await query(
    `INSERT INTO leads
       (name, email, phone, message, source, audience, consent, drip_status,
        created_at, resident_name, stage, stage_updated_at)
     VALUES ($1, $2, $3, $4, $5, 'leads', $6, 'completed',
             COALESCE($7::timestamptz, now()), $8, $9,
             CASE WHEN $9 <> 'new' THEN now() ELSE NULL END)`,
    [
      // name is NOT NULL: fall back to the email's local part.
      input.name?.trim() || input.email.split("@")[0] || input.email,
      input.email.toLowerCase(),
      input.phone ?? null,
      input.message ?? null,
      input.source,
      input.consent,
      input.createdAt ?? null,
      input.residentName?.trim() || null,
      stage,
    ]
  );
}

/**
 * Suppress an address after a hard bounce or spam complaint: mark every lead
 * row with this email unsubscribed and pause its drip, so we never send to it
 * again. Returns how many rows were suppressed.
 */
export async function suppressLeadByEmail(email: string): Promise<number> {
  const rows = await query<{ id: string }>(
    `UPDATE leads
        SET unsubscribed_at = COALESCE(unsubscribed_at, now()),
            drip_status = 'paused'
      WHERE lower(email) = lower($1)
        AND unsubscribed_at IS NULL
      RETURNING id`,
    [email]
  );
  return rows.length;
}

/** Admin-initiated unsubscribe of one lead by id (opts them out + pauses drip). */
export async function unsubscribeLead(id: string): Promise<void> {
  const rows = await query<{ email: string | null }>(
    `UPDATE leads
        SET unsubscribed_at = COALESCE(unsubscribed_at, now()),
            drip_status = 'paused'
      WHERE id = $1
      RETURNING email`,
    [id]
  );
  const email = rows[0]?.email;
  if (email) await suppressEmail(email, "unsubscribe");
}

/** Admin re-subscribe (undo a mistaken opt-out). Clears the opt-out timestamp. */
export async function resubscribeLead(id: string): Promise<void> {
  await query(
    `UPDATE leads SET unsubscribed_at = NULL WHERE id = $1`,
    [id]
  );
}

/** Mark a lead unsubscribed by its token. Returns true if a row was updated. */
export async function unsubscribeByToken(token: string): Promise<boolean> {
  const rows = await query<{ id: string; email: string | null }>(
    `UPDATE leads
       SET unsubscribed_at = now(), drip_status = 'paused'
     WHERE unsubscribe_token = $1
       AND unsubscribed_at IS NULL
     RETURNING id, email`,
    [token]
  );
  const email = rows[0]?.email;
  if (email) await suppressEmail(email, "unsubscribe");
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

type LeadListOpts = {
  source?: string;
  excludeImports?: boolean;
  /** Free-text search across name, email, resident name, and phone. */
  q?: string;
  limit?: number;
  offset?: number;
} & DateRange;

/** Shared WHERE for the leads list + its count (keeps them in sync). */
function leadListWhere(opts: LeadListOpts): {
  where: string;
  params: unknown[];
} {
  const conds = ["audience = 'leads'"];
  const params: unknown[] = [];
  if (opts.source) {
    params.push(opts.source);
    conds.push(`source = $${params.length}`);
  }
  if (opts.excludeImports) {
    conds.push(`source NOT LIKE '${IMPORT_SOURCE_PREFIX}%'`);
  }
  const q = opts.q?.trim();
  if (q) {
    // Escape LIKE wildcards so a literal % or _ in the query is matched as-is.
    const pat = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    params.push(pat);
    const p = `$${params.length}`;
    conds.push(
      `(name ILIKE ${p} OR email ILIKE ${p} OR resident_name ILIKE ${p} OR phone ILIKE ${p})`
    );
  }
  if (opts.from) {
    params.push(opts.from);
    conds.push(`created_at >= $${params.length}`);
  }
  if (opts.to) {
    params.push(opts.to);
    conds.push(`created_at <= $${params.length}`);
  }
  return { where: conds.join(" AND "), params };
}

export async function getAllLeads(opts: LeadListOpts = {}): Promise<Lead[]> {
  const { where, params } = leadListWhere(opts);
  let sql = `SELECT * FROM leads WHERE ${where} ORDER BY created_at DESC`;
  if (opts.limit != null) {
    params.push(opts.limit);
    sql += ` LIMIT $${params.length}`;
  }
  if (opts.offset != null) {
    params.push(opts.offset);
    sql += ` OFFSET $${params.length}`;
  }
  return query<Lead>(sql, params);
}

/** Total leads matching the same filters (for pagination). */
export async function countLeads(opts: LeadListOpts = {}): Promise<number> {
  const { where, params } = leadListWhere(opts);
  const rows = await query<{ n: string }>(
    `SELECT COUNT(*) AS n FROM leads WHERE ${where}`,
    params
  );
  return Number(rows[0]?.n ?? 0);
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const rows = await query<Lead>(`SELECT * FROM leads WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

/** Update a lead's lifecycle stage (new/toured/moved_in/lost). */
export async function setLeadStage(id: string, stage: LeadStage): Promise<void> {
  const rows = await query<{ email: string | null }>(
    `UPDATE leads SET stage = $2, stage_updated_at = now() WHERE id = $1
     RETURNING email`,
    [id, stage]
  );
  // A resident marked deceased is added to the suppression list, so the family's
  // contact is never emailed a marketing blast again (no override).
  const email = rows[0]?.email;
  if (stage === "deceased" && email) await suppressEmail(email, "deceased");
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
 * A recipient segment: drill into an audience by source, stage, and creation
 * date. An empty/undefined segment means the whole audience. Used to target
 * broadcasts ("send to leads from Facebook, still 'new', added since June").
 */
export type LeadSegment = {
  sources?: string[];
  stages?: LeadStage[];
  createdFrom?: string | null;
  createdTo?: string | null;
  /**
   * Frequency cap: exclude anyone who was sent an email in the last N days.
   * Evaluated live (from broadcast_recipients.sent_at), so it reflects sends
   * that happened after the broadcast was queued. 0 / undefined = no cap.
   */
  cooldownDays?: number | null;
  /**
   * Only include people who have NEVER been sent a broadcast email. Takes
   * precedence over cooldownDays (it is the strictest recency cap).
   */
  neverEmailed?: boolean;
};

/** Build the shared subscriber WHERE clause (base opt-in rules + segment). */
function segmentWhere(
  audience: Audience,
  seg?: LeadSegment
): { where: string; params: unknown[] } {
  const params: unknown[] = [audience];
  const conds = [
    "audience = $1",
    "unsubscribed_at IS NULL",
    "consent = TRUE",
    "email IS NOT NULL AND email <> ''",
    "(audience <> 'families' OR active = TRUE)",
    // The suppression list is absolute: a suppressed address is never a recipient.
    "lower(email) NOT IN (SELECT email FROM suppressions)",
  ];
  if (seg?.sources?.length) {
    params.push(seg.sources);
    conds.push(`source = ANY($${params.length}::text[])`);
  }
  if (seg?.stages?.length) {
    params.push(seg.stages);
    conds.push(`stage = ANY($${params.length}::text[])`);
  }
  if (seg?.createdFrom) {
    params.push(seg.createdFrom);
    conds.push(`created_at >= $${params.length}`);
  }
  if (seg?.createdTo) {
    params.push(seg.createdTo);
    conds.push(`created_at <= $${params.length}`);
  }
  if (seg?.neverEmailed) {
    // Strictest cap: anyone with any successful send on record is excluded.
    conds.push(
      `NOT EXISTS (
         SELECT 1 FROM broadcast_recipients br
          WHERE br.lead_id = leads.id
            AND br.error IS NULL
       )`
    );
  } else if (seg?.cooldownDays && seg.cooldownDays > 0) {
    params.push(seg.cooldownDays);
    conds.push(
      `NOT EXISTS (
         SELECT 1 FROM broadcast_recipients br
          WHERE br.lead_id = leads.id
            AND br.error IS NULL
            AND br.sent_at >= now() - make_interval(days => $${params.length}::int)
       )`
    );
  }
  return { where: conds.join(" AND "), params };
}

/**
 * Active, opted-in subscribers for an audience, optionally narrowed by segment.
 * Rows without an email (phone-only family contacts) are skipped, and for the
 * families audience only contacts of currently-active residents are included.
 */
export async function getSubscribedByAudience(
  audience: Audience,
  seg?: LeadSegment
): Promise<Lead[]> {
  const { where, params } = segmentWhere(audience, seg);
  return query<Lead>(
    `SELECT * FROM leads WHERE ${where} ORDER BY created_at ASC`,
    params
  );
}

/** How many recipients a segment resolves to right now (for the composer). */
export async function countSubscribers(
  audience: Audience,
  seg?: LeadSegment
): Promise<number> {
  const { where, params } = segmentWhere(audience, seg);
  const rows = await query<{ n: string }>(
    `SELECT COUNT(*) AS n FROM leads WHERE ${where}`,
    params
  );
  return Number(rows[0]?.n ?? 0);
}

/** Unsubscribed contacts in an audience. */
export async function countUnsubscribed(audience: Audience): Promise<number> {
  const rows = await query<{ n: string }>(
    `SELECT COUNT(*) AS n FROM leads
      WHERE audience = $1 AND unsubscribed_at IS NOT NULL`,
    [audience]
  );
  return Number(rows[0]?.n ?? 0);
}

/** Distinct source tags present in an audience (for the segment picker). */
export async function getAudienceSources(audience: Audience): Promise<string[]> {
  const rows = await query<{ source: string }>(
    `SELECT DISTINCT source FROM leads
      WHERE audience = $1 AND source IS NOT NULL AND source <> ''
      ORDER BY source`,
    [audience]
  );
  return rows.map((r) => r.source);
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
  /** Opt this contact into text messages on insert. */
  smsConsent?: boolean;
};

export async function insertFamilyMember(
  input: FamilyMemberInput
): Promise<Lead> {
  const email = input.email?.trim() ? input.email.trim().toLowerCase() : null;
  // Only opt into texts when a phone is actually on file.
  const smsConsent = !!input.smsConsent && !!input.phone?.trim();
  const rows = await query<Lead>(
    `INSERT INTO leads
       (name, email, phone, source, audience, consent, drip_status,
        resident_name, relation, active, unsubscribed_at, sms_consent)
     VALUES ($1, $2, $3, $4, 'families', TRUE, 'completed', $5, $6, $7, $8, $9)
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
      smsConsent,
    ]
  );
  return rows[0];
}

/**
 * Family contacts eligible for a SURVEY text: active, with a phone, and not
 * opted out (replied STOP). Survey requests are relationship messages to the
 * families we already serve (whose numbers they gave us as their contact), so
 * they do not require the separate marketing text-consent flag. A STOP opt-out
 * is always honored. (Marketing text blasts still use getSmsRecipients, which
 * requires explicit sms_consent.)
 */
export async function getFamilySurveyTextRecipients(): Promise<Lead[]> {
  const rows = await query<Lead>(
    `SELECT * FROM leads
      WHERE audience = 'families'
        AND active = TRUE
        AND sms_opt_out_at IS NULL
        AND phone IS NOT NULL AND phone <> ''
      ORDER BY lower(coalesce(resident_name,'')) ASC`
  );
  return excludeOptedOutPhones(rows);
}

/** Count of family contacts a survey text could reach (see above). */
export async function countFamilySurveyTextable(): Promise<number> {
  const rows = await getFamilySurveyTextRecipients();
  return rows.length;
}

/**
 * Turn on text consent for every active family contact that has a phone and
 * has not opted out. Returns how many were newly enabled. Lets the operator
 * opt in their existing families in one step (they attest they have permission).
 */
export async function enableSmsForFamiliesWithPhone(): Promise<number> {
  const candidates = await query<{ id: string; phone: string }>(
    `SELECT id, phone FROM leads
      WHERE audience = 'families'
        AND active = TRUE
        AND sms_consent = FALSE
        AND sms_opt_out_at IS NULL
        AND phone IS NOT NULL AND phone <> ''`
  );
  const blocked = await optedOutE164Phones();
  const ids = candidates
    .filter((r) => {
      const e164 = toE164(r.phone);
      // A STOP on any row with this number blocks consent, even when this row's flag is empty.
      return !e164 || !blocked.has(e164);
    })
    .map((r) => r.id);
  if (ids.length === 0) return 0;
  const rows = await query<{ id: string }>(
    `UPDATE leads SET sms_consent = TRUE
      WHERE id = ANY($1::uuid[])
      RETURNING id`,
    [ids]
  );
  return rows.length;
}

/** Family contacts that have a phone but texts are not on yet (opt-out excluded). */
export async function countFamiliesTextable(): Promise<number> {
  const rows = await query<{ phone: string }>(
    `SELECT phone FROM leads
      WHERE audience = 'families'
        AND active = TRUE
        AND sms_consent = FALSE
        AND sms_opt_out_at IS NULL
        AND phone IS NOT NULL AND phone <> ''`
  );
  const blocked = await optedOutE164Phones();
  return rows.filter((r) => {
    const e164 = toE164(r.phone);
    return !e164 || !blocked.has(e164);
  }).length;
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

export type FamilyContactUpdate = {
  name: string;
  email: string | null;
  phone: string | null;
  residentName: string | null;
  relation: string | null;
};

/**
 * Edit a family contact's details. Opt-in flags are left alone, except that
 * text consent is cleared when the phone number is removed.
 */
export async function updateFamilyMember(
  id: string,
  input: FamilyContactUpdate
): Promise<void> {
  const email = input.email?.trim() ? input.email.trim().toLowerCase() : null;
  const phone = input.phone?.trim() || null;
  await query(
    `UPDATE leads
        SET name = $2, email = $3, phone = $4, resident_name = $5, relation = $6,
            sms_consent = CASE WHEN $4::text IS NULL THEN FALSE ELSE sms_consent END
      WHERE id = $1 AND audience = 'families'`,
    [
      id,
      input.name.trim(),
      email,
      phone,
      input.residentName?.trim() || null,
      input.relation?.trim() || null,
    ]
  );
}

/**
 * Toggle a family contact's SMS consent (marketing texts on or off).
 * Consent cannot be turned back on after a STOP opt-out. That flag sticks
 * until it is cleared on purpose, and nothing in the admin does that.
 */
export async function setFamilySmsConsent(
  id: string,
  consent: boolean
): Promise<void> {
  if (!consent) {
    await query(`UPDATE leads SET sms_consent = FALSE WHERE id = $1`, [id]);
    return;
  }
  await query(
    `UPDATE leads SET sms_consent = TRUE
      WHERE id = $1 AND sms_opt_out_at IS NULL`,
    [id]
  );
}

/**
 * True when any leads row with this phone (any formatting) has sms_opt_out_at
 * set. The input is normalized with toE164. An invalid number is not opted out.
 */
export async function isPhoneSmsOptedOut(
  phone?: string | null
): Promise<boolean> {
  const e164 = toE164(phone);
  if (!e164) return false;
  const blocked = await optedOutE164Phones();
  return blocked.has(e164);
}

/**
 * Record a STOP for every leads row with this phone (families and prospective
 * leads). Clears text consent on those rows. Returns how many rows were updated.
 */
export async function markSmsOptOutByPhone(
  phone?: string | null
): Promise<number> {
  const e164 = toE164(phone);
  if (!e164) return 0;
  const rows = await query<{ id: string; phone: string }>(
    `SELECT id, phone FROM leads
      WHERE phone IS NOT NULL AND btrim(phone) <> ''`
  );
  const ids = rows.filter((r) => toE164(r.phone) === e164).map((r) => r.id);
  if (ids.length === 0) return 0;
  const updated = await query<{ id: string }>(
    `UPDATE leads
        SET sms_opt_out_at = COALESCE(sms_opt_out_at, now()),
            sms_consent = FALSE
      WHERE id = ANY($1::uuid[])
      RETURNING id`,
    [ids]
  );
  return updated.length;
}

/**
 * Mark a contact opted out of texts (they asked to stop, or replied STOP).
 * The same phone on any other leads row is opted out too.
 */
export async function markSmsOptOut(id: string): Promise<void> {
  const rows = await query<{ phone: string | null }>(
    `SELECT phone FROM leads WHERE id = $1`,
    [id]
  );
  const stamped = await markSmsOptOutByPhone(rows[0]?.phone);
  if (stamped > 0) return;
  await query(
    `UPDATE leads
        SET sms_opt_out_at = COALESCE(sms_opt_out_at, now()),
            sms_consent = FALSE
      WHERE id = $1`,
    [id]
  );
}

/** E.164 numbers that have opted out on at least one leads row. */
async function optedOutE164Phones(): Promise<Set<string>> {
  const rows = await query<{ phone: string }>(
    `SELECT phone FROM leads
      WHERE sms_opt_out_at IS NOT NULL
        AND phone IS NOT NULL AND btrim(phone) <> ''`
  );
  const set = new Set<string>();
  for (const row of rows) {
    const e164 = toE164(row.phone);
    if (e164) set.add(e164);
  }
  return set;
}

/** Drop rows whose phone matches any opted-out number, including other rows. */
async function excludeOptedOutPhones<T extends { phone: string | null }>(
  rows: T[]
): Promise<T[]> {
  const blocked = await optedOutE164Phones();
  if (blocked.size === 0) return rows;
  return rows.filter((r) => {
    const e164 = toE164(r.phone);
    return !e164 || !blocked.has(e164);
  });
}

/**
 * Text-blast recipients: family contacts who are active, have a phone, have
 * given SMS consent, and have not opted out.
 */
export async function getSmsRecipients(): Promise<Lead[]> {
  const rows = await query<Lead>(
    `SELECT * FROM leads
      WHERE audience = 'families'
        AND active = TRUE
        AND sms_consent = TRUE
        AND sms_opt_out_at IS NULL
        AND phone IS NOT NULL AND phone <> ''
      ORDER BY lower(coalesce(resident_name,'')) ASC`
  );
  return excludeOptedOutPhones(rows);
}

/** Remove a subscriber row (used to remove a family member). */
export async function deleteSubscriber(id: string): Promise<void> {
  await query(`DELETE FROM leads WHERE id = $1`, [id]);
}

export async function familyEmailExists(
  email: string,
  excludeId?: string
): Promise<boolean> {
  if (!email.trim()) return false;
  const rows = await query<{ id: string }>(
    `SELECT id FROM leads
      WHERE audience = 'families' AND lower(email) = lower($1)
        AND ($2::uuid IS NULL OR id <> $2::uuid)`,
    [email, excludeId ?? null]
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
