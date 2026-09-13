/**
 * Reviews vocabulary + row types. Pure (no DB import) so client components can
 * import the labels/types. lib/reviews.ts re-exports everything here and adds
 * the server-only queries; never import lib/reviews.ts from a client component.
 */

export const REVIEW_SOURCES = ["google", "apfm", "caring", "other"] as const;
export type ReviewSourceKey = (typeof REVIEW_SOURCES)[number];

export const REVIEW_SOURCE_LABEL: Record<string, string> = {
  google: "Google",
  apfm: "A Place for Mom",
  caring: "Caring.com",
  other: "Other",
};

export type ReviewStatus = "pending" | "published" | "hidden";

export type Review = {
  id: string;
  source: string;
  external_id: string | null;
  author: string | null;
  rating: string | null; // NUMERIC comes back as string
  body: string;
  review_date: string | null;
  url: string | null;
  status: ReviewStatus;
  featured: boolean;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type ReviewSource = {
  source: string;
  label: string;
  profile_url: string | null;
  rating_value: string | null;
  badge_label: string | null;
  enabled: boolean;
  updated_at: string;
};

/** Normalize a free-text platform name to a known source key. */
export function normalizeSource(s: string | null | undefined): string {
  const v = (s || "").trim().toLowerCase();
  if (v === "google") return "google";
  if (/apfm|a\s*place\s*for\s*mom|aplaceformom/.test(v)) return "apfm";
  if (/caring/.test(v)) return "caring";
  return (REVIEW_SOURCES as readonly string[]).includes(v) ? v : "other";
}
