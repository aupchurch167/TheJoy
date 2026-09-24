/**
 * Public description for a blog post.
 *
 * The stored summary is `meta_description` when set, otherwise `excerpt`
 * (the field the Webflow import and the blog cards use). Bing flags anything
 * much under 120 characters, so a blank or very short summary is replaced at
 * render time with the opening of the post, as plain text, cut on a word
 * boundary near 155 characters. A summary that is already long enough is
 * returned unchanged, character for character.
 */

export const MIN_DESCRIPTION_CHARS = 120;
export const DESCRIPTION_TARGET_CHARS = 155;

type SummarySource = {
  meta_description?: string | null;
  excerpt?: string | null;
  body?: string | null;
};

/** The summary an editor saved. Empty when both fields are blank. */
export function storedSummary(post: SummarySource): string {
  return (post.meta_description || post.excerpt || "").trim();
}

/**
 * Opening of a Markdown (or lightly marked-up) body as a single plain line.
 * Links keep their anchor text. The result is at most `max` characters and,
 * when it has to be cut, ends on a word boundary.
 */
export function openingPlainText(
  markdown: string,
  max = DESCRIPTION_TARGET_CHARS
): string {
  const plain = (markdown || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\\([\\`*_{}[\]()#+.!-])/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= max) return plain;

  const window = plain.slice(0, max + 1);
  const lastSpace = window.lastIndexOf(" ");
  const cut = lastSpace >= 40 ? lastSpace : max;
  return plain.slice(0, cut).replace(/[\s,;:]+$/g, "").trim();
}

/**
 * Description used for the meta description, og:description, twitter
 * description, and Article JSON-LD. Long stored summaries win. A blank or
 * short one falls back to the opening of the body when that opening is
 * longer.
 */
export function publicDescription(post: SummarySource): string | undefined {
  const summary = storedSummary(post);
  if (summary.length >= MIN_DESCRIPTION_CHARS) return summary;

  const fromBody = openingPlainText(post.body || "");
  if (fromBody.length > summary.length) return fromBody || undefined;
  return summary || undefined;
}

/**
 * Admin warning when a summary is blank or under MIN_DESCRIPTION_CHARS.
 * Returns null when the text is long enough to ship as-is.
 */
export function shortSummaryWarning(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length >= MIN_DESCRIPTION_CHARS) return null;
  if (trimmed.length === 0) {
    return "This summary is blank. Search engines flag empty descriptions, so the public page uses the opening of the post until this is at least 120 characters.";
  }
  return `${trimmed.length} characters. Search engines flag summaries under 120 characters, so the public page uses the opening of the post until this is longer.`;
}

/** ISO 8601 timestamp. pg returns Date objects; Next's meta tags need a string. */
export function isoDateTime(
  value: string | Date | null | undefined
): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}
