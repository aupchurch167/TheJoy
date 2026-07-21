import { query } from "./db";
import { SITE_URL, TRACKED_KEYWORDS } from "./site";

/**
 * Nightly SEO rank logging. Records each tracked keyword's Google position so
 * the admin can watch trends over time.
 *
 * Provider: SerpApi (serpapi.com) when SERPAPI_KEY is set. Without it, the
 * logger no-ops (nothing recorded), so the feature degrades gracefully.
 */

export type RankSnapshot = {
  id: string;
  keyword: string;
  position: number | null;
  url: string | null;
  checked_on: string;
  created_at: string;
};

export type KeywordTrend = {
  keyword: string;
  latest: number | null;
  history: { checked_on: string; position: number | null }[];
};

function domain(): string {
  try {
    return new URL(SITE_URL).hostname.replace(/^www\./, "");
  } catch {
    return "joyseniorcare.com";
  }
}

export function rankLoggingEnabled(): boolean {
  return !!process.env.SERPAPI_KEY;
}

/** Look up one keyword's position for our domain via SerpApi. */
async function fetchPosition(
  keyword: string
): Promise<{ position: number | null; url: string | null }> {
  const key = process.env.SERPAPI_KEY as string;
  const params = new URLSearchParams({
    engine: "google",
    q: keyword,
    num: "100",
    google_domain: "google.com",
    gl: "us",
    hl: "en",
    // Bias toward the local market where possible.
    location: process.env.SERPAPI_LOCATION || "Georgia, United States",
    api_key: key,
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`, {
    // Never cache rank lookups.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`SerpApi ${res.status}`);
  const data = (await res.json()) as {
    organic_results?: { position?: number; link?: string }[];
  };

  const host = domain();
  const hit = (data.organic_results || []).find((r) =>
    (r.link || "").toLowerCase().includes(host)
  );
  return { position: hit?.position ?? null, url: hit?.link ?? null };
}

/** Upsert today's snapshot for a keyword. */
async function saveSnapshot(
  keyword: string,
  position: number | null,
  url: string | null
): Promise<void> {
  await query(
    `INSERT INTO rank_snapshots (keyword, position, url)
     VALUES ($1, $2, $3)
     ON CONFLICT (keyword, checked_on)
     DO UPDATE SET position = EXCLUDED.position, url = EXCLUDED.url`,
    [keyword, position, url]
  );
}

/**
 * Record ranks for all tracked keywords. Returns how many were logged.
 * No-ops (returns 0) when no provider is configured.
 */
export async function recordRanks(): Promise<number> {
  if (!rankLoggingEnabled()) return 0;
  let logged = 0;
  for (const keyword of TRACKED_KEYWORDS) {
    try {
      const { position, url } = await fetchPosition(keyword);
      await saveSnapshot(keyword, position, url);
      logged++;
    } catch (err) {
      console.error("[ranks] failed for", keyword, err);
    }
  }
  return logged;
}

/** Trend data for the admin SEO page: latest + recent history per keyword. */
export async function getKeywordTrends(days = 30): Promise<KeywordTrend[]> {
  const rows = await query<{
    keyword: string;
    position: number | null;
    checked_on: string;
  }>(
    `SELECT keyword, position, checked_on::text
       FROM rank_snapshots
      WHERE checked_on >= (now() AT TIME ZONE 'UTC')::date - $1::int
      ORDER BY keyword ASC, checked_on ASC`,
    [days]
  );

  const byKeyword = new Map<string, KeywordTrend>();
  // Seed with all tracked keywords so untracked-yet ones still show.
  for (const kw of TRACKED_KEYWORDS) {
    byKeyword.set(kw, { keyword: kw, latest: null, history: [] });
  }
  for (const r of rows) {
    const entry =
      byKeyword.get(r.keyword) ??
      { keyword: r.keyword, latest: null, history: [] };
    entry.history.push({ checked_on: r.checked_on, position: r.position });
    entry.latest = r.position;
    byKeyword.set(r.keyword, entry);
  }
  return Array.from(byKeyword.values());
}
