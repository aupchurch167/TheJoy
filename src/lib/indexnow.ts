import { SITE_URL } from "./site";

/**
 * IndexNow: tells Bing (and Yandex, Seznam, Naver, which share submissions)
 * that a page is new or changed, so it gets crawled in minutes instead of
 * whenever Bing next comes around. Google does not use IndexNow.
 *
 * Setup is one env var: INDEXNOW_KEY (8 to 128 letters, digits, or dashes).
 * The key is served back at /<key>.txt (a rewrite in next.config.ts points it
 * at /api/indexnow/<key>), which is how Bing verifies we own the domain.
 * Without the key, every call here is a silent no-op.
 */

const ENDPOINT = "https://api.indexnow.org/indexnow";
const KEY_PATTERN = /^[a-zA-Z0-9-]{8,128}$/;

export function indexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim();
  return key && KEY_PATTERN.test(key) ? key : null;
}

/**
 * Only the real public host should ping. Local dev and the *.railway.app
 * preview URL (which is noindexed anyway) are skipped.
 */
function canSubmit(): boolean {
  const host = new URL(SITE_URL).hostname;
  return host !== "localhost" && !host.endsWith(".railway.app");
}

export type IndexNowResult =
  | { ok: true; submitted: number }
  | { ok: false; error: string };

/**
 * Submit absolute URLs on SITE_URL's host. Never throws; failures are logged
 * and returned so a ping can never break a save or the scheduler.
 */
export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  const key = indexNowKey();
  if (!key) return { ok: false, error: "INDEXNOW_KEY is not set." };
  if (!canSubmit()) return { ok: false, error: `Skipped for ${SITE_URL}.` };

  const host = new URL(SITE_URL).hostname;
  const urlList = [...new Set(urls)].filter((u) => {
    try {
      return new URL(u).hostname === host;
    } catch {
      return false;
    }
  });
  if (urlList.length === 0) return { ok: true, submitted: 0 };

  try {
    // The protocol allows up to 10,000 URLs per request; we are far below it.
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${SITE_URL}/${key}.txt`,
        urlList,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    // 200 = accepted, 202 = accepted while the key is still being verified.
    if (res.status === 200 || res.status === 202) {
      return { ok: true, submitted: urlList.length };
    }
    const error = `IndexNow returned ${res.status}.`;
    console.error("[indexnow]", error, await res.text().catch(() => ""));
    return { ok: false, error };
  } catch (err) {
    console.error("[indexnow]", err);
    return { ok: false, error: "Could not reach IndexNow." };
  }
}

/** Public URLs to ping when a blog post goes live or changes. */
export function postUrls(slug: string): string[] {
  return [`${SITE_URL}/blog/${slug}`, `${SITE_URL}/blog`, `${SITE_URL}/`];
}
