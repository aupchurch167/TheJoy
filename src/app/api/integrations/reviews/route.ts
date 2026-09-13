import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase } from "@/lib/db";
import { integrationKeysConfigured, verifyApiKey } from "@/lib/api-keys";
import {
  listReviews,
  listReviewSources,
  upsertIngestedReview,
  upsertReviewSource,
  type ReviewStatus,
} from "@/lib/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reviews integration endpoint for external agents (e.g. GrokBot).
 *
 * AUTH: a scoped API key (INTEGRATION_API_KEYS), sent as
 *   Authorization: Bearer <key>   (or the X-API-Key header).
 * This key ONLY reaches this endpoint; it never grants admin access, and every
 * ingested review lands as 'pending' until an admin approves it in /admin/reviews.
 *
 * POST  submit reviews and/or per-platform source profiles (upsert).
 * GET   read current reviews (optionally ?status=) and sources, to reconcile.
 */

const ReviewItem = z.object({
  source: z.string().trim().min(1).max(40),
  external_id: z.string().trim().max(200).optional().nullable(),
  author: z.string().trim().max(200).optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  body: z.string().trim().min(1).max(10000),
  review_date: z.string().trim().max(30).optional().nullable(),
  url: z.string().trim().max(1000).optional().nullable(),
});

const SourceItem = z.object({
  source: z.string().trim().min(1).max(40),
  label: z.string().trim().max(120).optional().nullable(),
  profile_url: z.string().trim().max(1000).optional().nullable(),
  rating_value: z.string().trim().max(20).optional().nullable(),
  badge_label: z.string().trim().max(120).optional().nullable(),
  enabled: z.boolean().optional(),
});

const Payload = z
  .object({
    reviews: z.array(ReviewItem).max(500).optional(),
    sources: z.array(SourceItem).max(20).optional(),
  })
  .refine((d) => (d.reviews?.length ?? 0) + (d.sources?.length ?? 0) > 0, {
    message: "Provide at least one review or source.",
  });

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
}

async function guard(req: Request): Promise<
  { ok: true; label: string } | { ok: false; res: NextResponse }
> {
  if (!integrationKeysConfigured()) {
    return {
      ok: false,
      res: NextResponse.json(
        { ok: false, error: "Integration API is not configured." },
        { status: 503 }
      ),
    };
  }
  if (!hasDatabase()) {
    return {
      ok: false,
      res: NextResponse.json(
        { ok: false, error: "No database configured." },
        { status: 503 }
      ),
    };
  }
  const label = await verifyApiKey(req);
  if (!label) return { ok: false, res: unauthorized() };
  return { ok: true, label };
}

export async function POST(req: Request) {
  const g = await guard(req);
  if (!g.ok) return g.res;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = Payload.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payload." },
      { status: 400 }
    );
  }

  let created = 0;
  let updated = 0;
  let sourcesUpserted = 0;
  try {
    for (const r of parsed.data.reviews ?? []) {
      const { created: isNew } = await upsertIngestedReview(r, g.label);
      if (isNew) created++;
      else updated++;
    }
    for (const s of parsed.data.sources ?? []) {
      await upsertReviewSource(s);
      sourcesUpserted++;
    }
  } catch (err) {
    console.error("[reviews ingest]", err);
    return NextResponse.json(
      { ok: false, error: "Could not store the submission." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    reviews: { created, updated },
    sources: { upserted: sourcesUpserted },
    note: "Reviews are pending until an admin approves them in /admin/reviews.",
  });
}

export async function GET(req: Request) {
  const g = await guard(req);
  if (!g.ok) return g.res;

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam === "pending" ||
    statusParam === "published" ||
    statusParam === "hidden"
      ? (statusParam as ReviewStatus)
      : undefined;

  const [reviews, sources] = await Promise.all([
    listReviews(status),
    listReviewSources(),
  ]);

  // Return the fields an integration needs to reconcile/dedupe (no internals).
  return NextResponse.json({
    ok: true,
    reviews: reviews.map((r) => ({
      id: r.id,
      source: r.source,
      external_id: r.external_id,
      author: r.author,
      rating: r.rating,
      body: r.body,
      review_date: r.review_date,
      url: r.url,
      status: r.status,
    })),
    sources,
  });
}
