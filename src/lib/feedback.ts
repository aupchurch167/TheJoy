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

/** 4-5 is positive, 1-3 is a concern (spec §Database). */
export function sentimentFor(rating: number): Sentiment {
  return rating >= 4 ? "positive" : "concern";
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

/** Admin list: each request with its linked response's rating/sentiment (if any). */
export type FeedbackRequestRow = FeedbackRequest & {
  rating: number | null;
  sentiment: Sentiment | null;
};

export async function listFeedbackRequests(): Promise<FeedbackRequestRow[]> {
  return query<FeedbackRequestRow>(
    `SELECT r.*, resp.overall_rating AS rating, resp.sentiment
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
  goingWell?: string | null;
  couldBeBetter?: string | null;
  suggestions?: string | null;
  anonymous: boolean;
}): Promise<FeedbackResponse> {
  const sentiment = sentimentFor(input.rating);
  const rows = await query<FeedbackResponse>(
    `INSERT INTO feedback_responses
       (request_id, overall_rating, going_well, could_be_better, suggestions,
        is_anonymous, sentiment)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.anonymous ? null : input.request.id,
      input.rating,
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
