import { randomBytes } from "node:crypto";
import { query } from "./db";

/**
 * Family feedback + review funnel (Change Set 02). An admin sends a tokenized
 * survey to a family; the family rates their experience; a positive rating is
 * routed toward public reviews, a concern toward a private callback (and an
 * internal alert). Anonymity is honored: an anonymous response is never linked
 * back to the request that produced it.
 */

export type Sentiment = "positive" | "concern";
export type CallbackStatus = "open" | "contacted" | "resolved";
export type Recommend = "definitely" | "probably" | "not_sure" | "no";

/** The five optional dimension taps (1 = Needs work, 2 = Okay, 3 = Great). */
export type Dimensions = {
  care: number | null;
  communication: number | null;
  dining: number | null;
  home_feel: number | null;
  engagement: number | null;
};

/** How a survey invitation was delivered. */
export type SurveyChannel = "email" | "sms" | "both";

export type FeedbackRequest = {
  id: string;
  family_name: string;
  family_email: string | null;
  family_phone: string | null;
  channel: SurveyChannel;
  resident_first_name: string | null;
  token: string;
  sent_at: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
};

/**
 * How often a single family may be asked for feedback. A survey invitation
 * (email OR text) is never sent to the same contact more than once in this
 * window, so re-running "send to all" only reaches families who are due again.
 */
export const SURVEY_MIN_INTERVAL_DAYS = 30;

export type FeedbackResponse = {
  id: string;
  request_id: string | null;
  overall_rating: number;
  rating_care: number | null;
  rating_communication: number | null;
  rating_dining: number | null;
  rating_home_feel: number | null;
  rating_engagement: number | null;
  would_recommend: Recommend | null;
  going_well: string | null;
  could_be_better: string | null;
  suggestions: string | null;
  is_anonymous: boolean;
  sentiment: Sentiment;
  created_at: string;
};

export type CallbackRequest = {
  id: string;
  response_id: string | null;
  contact_name: string;
  contact_phone: string;
  preferred_time: string | null;
  status: CallbackStatus;
  created_at: string;
};

/**
 * Sentiment keys off more than the heart count: a response is a "concern" when
 * the overall rating is 3 or below, OR any dimension is "Needs work" (1), OR
 * the family would not clearly recommend ("not_sure"/"no"). A 4-5 heart
 * response with any "Needs work" still routes to the concern path.
 */
export function computeSentiment(input: {
  overall: number;
  dimensions: Dimensions;
  recommend: Recommend | null;
}): Sentiment {
  if (input.overall <= 3) return "concern";
  const dims = Object.values(input.dimensions);
  if (dims.some((d) => d === 1)) return "concern";
  if (input.recommend === "not_sure" || input.recommend === "no")
    return "concern";
  return "positive";
}

// Hex (lowercase, 0-9a-f) so the token survives the site's path-lowercasing
// middleware unchanged. 24 bytes = 48 chars, comfortably above the 32 minimum.
function newToken(): string {
  return randomBytes(24).toString("hex");
}

/* ---------------- requests ---------------- */

export async function createFeedbackRequest(input: {
  familyName: string;
  familyEmail?: string | null;
  familyPhone?: string | null;
  channel?: SurveyChannel;
  residentFirstName?: string | null;
  createdBy: string;
}): Promise<FeedbackRequest> {
  const rows = await query<FeedbackRequest>(
    `INSERT INTO feedback_requests
       (family_name, family_email, family_phone, channel, resident_first_name,
        token, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.familyName.trim(),
      input.familyEmail?.trim().toLowerCase() || null,
      input.familyPhone?.trim() || null,
      input.channel ?? "email",
      input.residentFirstName?.trim() || null,
      newToken(),
      input.createdBy,
    ]
  );
  return rows[0];
}

export async function markRequestSent(id: string): Promise<void> {
  await query(`UPDATE feedback_requests SET sent_at = now() WHERE id = $1`, [id]);
}

export async function markRequestCompleted(id: string): Promise<void> {
  await query(
    `UPDATE feedback_requests SET completed_at = now()
      WHERE id = $1 AND completed_at IS NULL`,
    [id]
  );
}

/** Emails that already have an outstanding (not completed) survey request. */
export async function getOpenRequestEmails(): Promise<Set<string>> {
  const rows = await query<{ family_email: string | null }>(
    `SELECT DISTINCT lower(family_email) AS family_email
       FROM feedback_requests
      WHERE completed_at IS NULL AND family_email IS NOT NULL`
  );
  return new Set(rows.map((r) => r.family_email!).filter(Boolean));
}

/**
 * Contacts (by email and by phone) already asked for feedback within the last
 * `days`. Used to enforce the once-a-month guardrail across both channels: a
 * family whose email or phone appears here is not invited again yet.
 */
export async function getRecentlyContacted(
  days = SURVEY_MIN_INTERVAL_DAYS
): Promise<{ emails: Set<string>; phones: Set<string> }> {
  const rows = await query<{
    family_email: string | null;
    family_phone: string | null;
  }>(
    `SELECT lower(family_email) AS family_email, family_phone
       FROM feedback_requests
      WHERE created_at >= now() - make_interval(days => $1)`,
    [days]
  );
  const emails = new Set<string>();
  const phones = new Set<string>();
  for (const r of rows) {
    if (r.family_email) emails.add(r.family_email);
    if (r.family_phone) phones.add(r.family_phone);
  }
  return { emails, phones };
}

export async function getRequestByToken(
  token: string
): Promise<FeedbackRequest | null> {
  const rows = await query<FeedbackRequest>(
    `SELECT * FROM feedback_requests WHERE token = $1 LIMIT 1`,
    [token]
  );
  return rows[0] ?? null;
}

export async function getRequestById(
  id: string
): Promise<FeedbackRequest | null> {
  const rows = await query<FeedbackRequest>(
    `SELECT * FROM feedback_requests WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/** Admin list: each request with its linked response detail (if any / not anon). */
export type FeedbackRequestRow = FeedbackRequest & {
  rating: number | null;
  sentiment: Sentiment | null;
  would_recommend: Recommend | null;
  rating_care: number | null;
  rating_communication: number | null;
  rating_dining: number | null;
  rating_home_feel: number | null;
  rating_engagement: number | null;
  going_well: string | null;
  could_be_better: string | null;
  suggestions: string | null;
};

/** Rolled-up feedback numbers for the compilation view. */
export type FeedbackSummary = {
  sent: number; // survey requests that were actually sent
  completed: number; // requests marked completed (incl. anonymous)
  responseRate: number | null; // completed / sent, 0..1
  responses: number; // response rows on file (incl. anonymous)
  anonymous: number;
  avgOverall: number | null; // mean hearts, 1..5
  positive: number;
  concern: number;
  openCallbacks: number;
  /** Mean of each dimension on the 1..3 scale (null when never rated). */
  dimensions: {
    care: number | null;
    communication: number | null;
    dining: number | null;
    home_feel: number | null;
    engagement: number | null;
  };
  /** Would-recommend counts. */
  recommend: { definitely: number; probably: number; not_sure: number; no: number };
};

const numOrNull = (v: unknown): number | null =>
  v === null || v === undefined ? null : Number(v);

/** Optional reporting window (ISO timestamps). Omit a bound to leave it open. */
export type FeedbackRange = { from?: string | null; to?: string | null };

/** Build a "created_at BETWEEN ..." clause, pushing bound params as it goes. */
function rangeClause(
  col: string,
  range: FeedbackRange | undefined,
  params: unknown[]
): string {
  const conds: string[] = [];
  if (range?.from) {
    params.push(range.from);
    conds.push(`${col} >= $${params.length}`);
  }
  if (range?.to) {
    params.push(range.to);
    conds.push(`${col} <= $${params.length}`);
  }
  return conds.length ? `WHERE ${conds.join(" AND ")}` : "";
}

/**
 * Aggregate every response on file (anonymous included, since those still carry
 * a rating) plus request/callback counts, for the compilation strip.
 */
export async function getFeedbackSummary(
  range?: FeedbackRange
): Promise<FeedbackSummary> {
  const reqParams: unknown[] = [];
  const reqWhere = rangeClause("created_at", range, reqParams);
  const respParams: unknown[] = [];
  const respWhere = rangeClause("created_at", range, respParams);

  const [reqRows, respRows, cbRows] = await Promise.all([
    query<{ sent: string; completed: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE sent_at IS NOT NULL) AS sent,
         COUNT(*) FILTER (WHERE completed_at IS NOT NULL) AS completed
       FROM feedback_requests ${reqWhere}`,
      reqParams
    ),
    query<Record<string, string | null>>(
      `SELECT
         COUNT(*) AS responses,
         COUNT(*) FILTER (WHERE is_anonymous) AS anonymous,
         AVG(overall_rating) AS avg_overall,
         COUNT(*) FILTER (WHERE sentiment = 'positive') AS positive,
         COUNT(*) FILTER (WHERE sentiment = 'concern') AS concern,
         AVG(rating_care) AS avg_care,
         AVG(rating_communication) AS avg_communication,
         AVG(rating_dining) AS avg_dining,
         AVG(rating_home_feel) AS avg_home_feel,
         AVG(rating_engagement) AS avg_engagement,
         COUNT(*) FILTER (WHERE would_recommend = 'definitely') AS rec_definitely,
         COUNT(*) FILTER (WHERE would_recommend = 'probably') AS rec_probably,
         COUNT(*) FILTER (WHERE would_recommend = 'not_sure') AS rec_not_sure,
         COUNT(*) FILTER (WHERE would_recommend = 'no') AS rec_no
       FROM feedback_responses ${respWhere}`,
      respParams
    ),
    query<{ n: string }>(
      `SELECT COUNT(*) AS n FROM callback_requests WHERE status = 'open'`
    ),
  ]);

  const req = reqRows[0] ?? { sent: "0", completed: "0" };
  const r = respRows[0] ?? {};
  const sent = Number(req.sent ?? 0);
  const completed = Number(req.completed ?? 0);

  return {
    sent,
    completed,
    responseRate: sent > 0 ? completed / sent : null,
    responses: Number(r.responses ?? 0),
    anonymous: Number(r.anonymous ?? 0),
    avgOverall: numOrNull(r.avg_overall),
    positive: Number(r.positive ?? 0),
    concern: Number(r.concern ?? 0),
    openCallbacks: Number(cbRows[0]?.n ?? 0),
    dimensions: {
      care: numOrNull(r.avg_care),
      communication: numOrNull(r.avg_communication),
      dining: numOrNull(r.avg_dining),
      home_feel: numOrNull(r.avg_home_feel),
      engagement: numOrNull(r.avg_engagement),
    },
    recommend: {
      definitely: Number(r.rec_definitely ?? 0),
      probably: Number(r.rec_probably ?? 0),
      not_sure: Number(r.rec_not_sure ?? 0),
      no: Number(r.rec_no ?? 0),
    },
  };
}

/**
 * A single readable response, whether tied to a family or submitted
 * anonymously. Anonymous rows carry no identity (request_id and family_name are
 * null) so they can be read without breaking anonymity.
 */
export type ReadableResponse = {
  id: string;
  request_id: string | null;
  family_name: string | null;
  is_anonymous: boolean;
  overall_rating: number;
  sentiment: Sentiment;
  would_recommend: Recommend | null;
  rating_care: number | null;
  rating_communication: number | null;
  rating_dining: number | null;
  rating_home_feel: number | null;
  rating_engagement: number | null;
  going_well: string | null;
  could_be_better: string | null;
  suggestions: string | null;
  created_at: string;
};

/** Every response on file for the reader (attributed and anonymous), concerns first. */
export async function listReadableResponses(
  range?: FeedbackRange
): Promise<ReadableResponse[]> {
  const params: unknown[] = [];
  const where = rangeClause("resp.created_at", range, params);
  return query<ReadableResponse>(
    `SELECT resp.id, resp.request_id, req.family_name, resp.is_anonymous,
            resp.overall_rating, resp.sentiment, resp.would_recommend,
            resp.rating_care, resp.rating_communication, resp.rating_dining,
            resp.rating_home_feel, resp.rating_engagement,
            resp.going_well, resp.could_be_better, resp.suggestions,
            resp.created_at
       FROM feedback_responses resp
       LEFT JOIN feedback_requests req ON req.id = resp.request_id
       ${where}
      ORDER BY (resp.sentiment = 'concern') DESC, resp.created_at DESC`,
    params
  );
}

/** One month's bucket for the trend view. */
export type FeedbackTrendPoint = {
  month: string; // 'YYYY-MM'
  responses: number;
  avgOverall: number | null;
  concern: number;
};

/**
 * Monthly response counts and average rating, oldest to newest, so the report
 * can show how feedback changes over time. Limited to the most recent `months`.
 */
export async function getFeedbackTrend(months = 12): Promise<FeedbackTrendPoint[]> {
  const rows = await query<{
    month: string;
    responses: string;
    avg_overall: string | null;
    concern: string;
  }>(
    `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
            COUNT(*) AS responses,
            AVG(overall_rating) AS avg_overall,
            COUNT(*) FILTER (WHERE sentiment = 'concern') AS concern
       FROM feedback_responses
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT $1`,
    [months]
  );
  return rows
    .map((r) => ({
      month: r.month,
      responses: Number(r.responses),
      avgOverall: numOrNull(r.avg_overall),
      concern: Number(r.concern),
    }))
    .reverse();
}

export async function listFeedbackRequests(): Promise<FeedbackRequestRow[]> {
  return query<FeedbackRequestRow>(
    `SELECT r.*,
            resp.overall_rating AS rating, resp.sentiment, resp.would_recommend,
            resp.rating_care, resp.rating_communication, resp.rating_dining,
            resp.rating_home_feel, resp.rating_engagement,
            resp.going_well, resp.could_be_better, resp.suggestions
       FROM feedback_requests r
       LEFT JOIN feedback_responses resp ON resp.request_id = r.id
      ORDER BY r.created_at DESC`
  );
}

/* ---------------- responses ---------------- */

/**
 * Store a survey response. When anonymous, request_id is left NULL so the
 * answers can't be tied to the family; the request is still stamped completed.
 * Returns the new response row.
 */
export async function submitResponse(input: {
  request: FeedbackRequest;
  rating: number;
  dimensions: Dimensions;
  recommend: Recommend | null;
  goingWell?: string | null;
  couldBeBetter?: string | null;
  suggestions?: string | null;
  anonymous: boolean;
}): Promise<FeedbackResponse> {
  const sentiment = computeSentiment({
    overall: input.rating,
    dimensions: input.dimensions,
    recommend: input.recommend,
  });
  const d = input.dimensions;
  const rows = await query<FeedbackResponse>(
    `INSERT INTO feedback_responses
       (request_id, overall_rating, rating_care, rating_communication,
        rating_dining, rating_home_feel, rating_engagement, would_recommend,
        going_well, could_be_better, suggestions, is_anonymous, sentiment)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      input.anonymous ? null : input.request.id,
      input.rating,
      d.care,
      d.communication,
      d.dining,
      d.home_feel,
      d.engagement,
      input.recommend,
      input.goingWell?.trim() || null,
      input.couldBeBetter?.trim() || null,
      input.suggestions?.trim() || null,
      input.anonymous,
      sentiment,
    ]
  );
  // The request is marked completed either way (so the admin sees it was done).
  await markRequestCompleted(input.request.id);
  return rows[0];
}

export async function getResponseById(
  id: string
): Promise<FeedbackResponse | null> {
  const rows = await query<FeedbackResponse>(
    `SELECT * FROM feedback_responses WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/* ---------------- callbacks ---------------- */

export async function createCallbackRequest(input: {
  responseId: string | null;
  contactName: string;
  contactPhone: string;
  preferredTime?: string | null;
}): Promise<CallbackRequest> {
  const rows = await query<CallbackRequest>(
    `INSERT INTO callback_requests
       (response_id, contact_name, contact_phone, preferred_time)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      input.responseId,
      input.contactName.trim(),
      input.contactPhone.trim(),
      input.preferredTime?.trim() || null,
    ]
  );
  return rows[0];
}

export async function listCallbackRequests(): Promise<CallbackRequest[]> {
  // Open first, then by newest.
  return query<CallbackRequest>(
    `SELECT * FROM callback_requests
      ORDER BY (status = 'open') DESC, created_at DESC`
  );
}

export async function setCallbackStatus(
  id: string,
  status: CallbackStatus
): Promise<void> {
  await query(`UPDATE callback_requests SET status = $2 WHERE id = $1`, [
    id,
    status,
  ]);
}
