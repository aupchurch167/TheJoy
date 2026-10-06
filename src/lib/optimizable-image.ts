/**
 * Which image URLs may go through next/image.
 *
 * next/image throws on hostnames that are not in images.remotePatterns
 * (next.config.ts). That allowlist must stay a superset of the hosts here.
 * Anything else falls back to a plain img so an unexpected URL cannot crash
 * a page.
 */
const OPTIMIZABLE_HOST = [/(^|\.)r2\.dev$/i, /(^|\.)website-files\.com$/i];

export function canOptimize(src: string): boolean {
  if (!src) return false;
  // Local /public path (not a protocol-relative //host URL).
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const { hostname } = new URL(src);
    if (hostname === "uploads-ssl.webflow.com") return true;
    return OPTIMIZABLE_HOST.some((re) => re.test(hostname));
  } catch {
    return false;
  }
}

/**
 * Blog index card thumbnail. Below the sm breakpoint the photo is the full
 * card (page px-5 + card p-5). From 640px up the track is 200px.
 *
 * The viewport length is inside calc() on purpose. A bare `100vw` token makes
 * Next drop srcset candidates under 640px, so a 200px card would still download
 * a 640px file.
 */
export const BLOG_CARD_SIZES = "(max-width: 639px) calc(100vw - 5rem), 200px";

/**
 * Blog post column. The article is max-w-2xl (42rem) with px-5, so the photo
 * is at most 632px wide.
 */
export const BLOG_PROSE_SIZES =
  "(max-width: 672px) calc(100vw - 2.5rem), 632px";

/** Event / RSVP cards (max-w-xl with padding). */
export const COMPACT_PROSE_SIZES =
  "(max-width: 576px) calc(100vw - 5rem), 480px";

/** Compare two image URLs, ignoring query, hash, and encoding differences. */
export function sameImage(a: string, b: string): boolean {
  if (!a || !b) return false;
  return imageIdentity(a) === imageIdentity(b);
}

function imageIdentity(src: string): string {
  const trimmed = src.trim();
  try {
    const url = trimmed.startsWith("/")
      ? new URL(trimmed, "https://images.local")
      : new URL(trimmed);
    url.hash = "";
    url.search = "";
    let path = url.pathname;
    try {
      path = decodeURIComponent(path);
    } catch {
      // Leave a malformed escape sequence as-is.
    }
    return `${url.protocol}//${url.host.toLowerCase()}${path}`.replace(
      /\/+$/,
      ""
    );
  } catch {
    return trimmed;
  }
}
