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

export type FeedbackRequest = {
  id: string;
  family_name: string;
  family_email: string;
  resident_first_name: string | null;
  token: string;
  sent_at: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
};

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
  familyEmail: string;
  residentFirstName?: string | null;
  createdBy: string;
}): Promise<FeedbackRequest> {
  const rows = await query<FeedbackRequest>(
    `INSERT INTO feedback_requests
       (family_name, family_email, resident_first_name, token, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      input.familyName.trim(),
      input.familyEmail.trim().toLowerCase(),
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
  const rows = await query<{ family_email: string }>(
    `SELECT DISTINCT lower(family_email) AS family_email
       FROM feedback_requests WHERE completed_at IS NULL`
  );
  return new Set(rows.map((r) => r.family_email));
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
