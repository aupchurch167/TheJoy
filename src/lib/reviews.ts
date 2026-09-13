import { query } from "./db";
import {
  REVIEW_SOURCE_LABEL,
  normalizeSource,
  type Review,
  type ReviewSource,
  type ReviewStatus,
} from "./reviews-vocab";

/**
 * Reviews data layer. Individual reviews from external platforms (ingested via
 * the API, approval-gated) plus per-platform "source" profiles (link + badge).
 * Mirrors the query()/hasDatabase() conventions used elsewhere. The vocabulary
 * (labels, types, normalizeSource) lives in reviews-vocab (no pg import) so
 * client components can use it; this module adds the server-only queries.
 */

export * from "./reviews-vocab";

/* ---------------- Reads ---------------- */

/** Reviews for the admin queue, newest first, optionally filtered by status. */
export async function listReviews(status?: ReviewStatus): Promise<Review[]> {
  if (status) {
    return query<Review>(
      `SELECT * FROM reviews WHERE status = $1 ORDER BY created_at DESC`,
      [status]
    );
  }
  return query<Review>(`SELECT * FROM reviews ORDER BY created_at DESC`);
}

/** Published reviews for the public site, newest review first. */
export async function listPublishedReviews(limit = 100): Promise<Review[]> {
  return query<Review>(
    `SELECT * FROM reviews
      WHERE status = 'published'
      ORDER BY (review_date IS NULL), review_date DESC, published_at DESC
      LIMIT $1`,
    [limit]
  );
}

export async function countReviewsByStatus(): Promise<
  Record<ReviewStatus, number>
> {
  const rows = await query<{ status: ReviewStatus; n: string }>(
    `SELECT status, count(*)::int AS n FROM reviews GROUP BY status`
  );
  const out: Record<ReviewStatus, number> = {
    pending: 0,
    published: 0,
    hidden: 0,
  };
  for (const r of rows) out[r.status] = Number(r.n);
  return out;
}

export async function getReview(id: string): Promise<Review | null> {
  const rows = await query<Review>(`SELECT * FROM reviews WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

/* ---------------- Ingest (upsert) ---------------- */

export type ReviewIngest = {
  source: string;
  external_id?: string | null;
  author?: string | null;
  rating?: number | null;
  body: string;
  review_date?: string | null;
  url?: string | null;
};


/**
 * Insert an ingested review as 'pending', or update the existing row (matched by
 * source+external_id) in place WITHOUT changing its moderation status. Returns
 * whether a new row was created. Never publishes anything.
 */
export async function upsertIngestedReview(
  input: ReviewIngest,
  submittedBy: string
): Promise<{ created: boolean }> {
  const source = normalizeSource(input.source);
  const extId = input.external_id?.trim() || null;

  if (extId) {
    // Update existing content but keep whatever status a human already set.
    const updated = await query<{ id: string }>(
      `UPDATE reviews
          SET author = $3, rating = $4, body = $5, review_date = $6, url = $7,
              submitted_by = $8, updated_at = now()
        WHERE source = $1 AND external_id = $2
        RETURNING id`,
      [
        source,
        extId,
        input.author ?? null,
        input.rating ?? null,
        input.body,
        input.review_date || null,
        input.url ?? null,
        submittedBy,
      ]
    );
    if (updated.length > 0) return { created: false };
  }

  await query(
    `INSERT INTO reviews
       (source, external_id, author, rating, body, review_date, url,
        status, submitted_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8)`,
    [
      source,
      extId,
      input.author ?? null,
      input.rating ?? null,
      input.body,
      input.review_date || null,
      input.url ?? null,
      submittedBy,
    ]
  );
  return { created: true };
}

/* ---------------- Moderation ---------------- */

export async function setReviewStatus(
  id: string,
  status: ReviewStatus
): Promise<void> {
  await query(
    `UPDATE reviews
        SET status = $2,
            published_at = CASE WHEN $2 = 'published'
                                THEN COALESCE(published_at, now()) ELSE published_at END,
            updated_at = now()
      WHERE id = $1`,
    [id, status]
  );
}

export async function setReviewFeatured(
  id: string,
  featured: boolean
): Promise<void> {
  await query(
    `UPDATE reviews SET featured = $2, updated_at = now() WHERE id = $1`,
    [id, featured]
  );
}

export async function deleteReview(id: string): Promise<void> {
  await query(`DELETE FROM reviews WHERE id = $1`, [id]);
}

/* ---------------- Sources (profiles + badges) ---------------- */

export async function listReviewSources(
  enabledOnly = false
): Promise<ReviewSource[]> {
  if (enabledOnly) {
    return query<ReviewSource>(
      `SELECT * FROM review_sources WHERE enabled = TRUE ORDER BY label`
    );
  }
  return query<ReviewSource>(`SELECT * FROM review_sources ORDER BY label`);
}

export type ReviewSourceInput = {
  source: string;
  label?: string | null;
  profile_url?: string | null;
  rating_value?: string | null;
  badge_label?: string | null;
  enabled?: boolean;
};

/** Create or update a per-platform source profile (link + badge). */
export async function upsertReviewSource(input: ReviewSourceInput): Promise<void> {
  const source = normalizeSource(input.source);
  const label = input.label?.trim() || REVIEW_SOURCE_LABEL[source] || source;
  await query(
    `INSERT INTO review_sources
       (source, label, profile_url, rating_value, badge_label, enabled, updated_at)
     VALUES ($1,$2,$3,$4,$5,COALESCE($6, TRUE), now())
     ON CONFLICT (source) DO UPDATE SET
       label = EXCLUDED.label,
       profile_url = EXCLUDED.profile_url,
       rating_value = EXCLUDED.rating_value,
       badge_label = EXCLUDED.badge_label,
       enabled = EXCLUDED.enabled,
       updated_at = now()`,
    [
      source,
      label,
      input.profile_url ?? null,
      input.rating_value ?? null,
      input.badge_label ?? null,
      input.enabled ?? null,
    ]
  );
}
