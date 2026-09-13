/**
 * Tiny allowlist HTML sanitizer for admin-authored rich text (partner notes).
 * Pure (no DOM), so it runs on the server before storing and is safe to render
 * with dangerouslySetInnerHTML. Threat model is stored XSS in the admin panel:
 * only signed-in admins write this, but we still strip anything executable.
 *
 * Allowed: basic inline emphasis, lists, paragraphs/line breaks, and links
 * (http/https/mailto only). Everything else has its tag markup removed while the
 * inner text is kept. Scripts/styles/iframes are dropped with their content.
 */

const ALLOWED_TAGS = new Set([
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "strike",
  "p",
  "div",
  "br",
  "ul",
  "ol",
  "li",
  "a",
  "span",
  "blockquote",
]);

// Elements whose CONTENT must go too (not just the tag).
const DROP_WITH_CONTENT =
  /<(script|style|iframe|object|embed|noscript|template|svg|math)\b[\s\S]*?<\/\1\s*>/gi;

function escapeAttrValue(v: string): string {
  return v.replace(/[<>"']/g, (c) =>
    c === "<" ? "%3C" : c === ">" ? "%3E" : c === '"' ? "%22" : "%27"
  );
}

function safeHref(attrs: string): string | null {
  const m = attrs.match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if (!m) return null;
  const raw = (m[2] ?? m[3] ?? m[4] ?? "").trim();
  if (/^(https?:|mailto:)/i.test(raw)) return escapeAttrValue(raw);
  return null;
}

export function sanitizeNotesHtml(input: string | null | undefined): string {
  if (!input) return "";
  let s = String(input);

  // Drop comments and dangerous elements (with their content).
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(DROP_WITH_CONTENT, "");

  // Walk every tag: keep allowed ones (attributes stripped, except a[href]);
  // remove the markup of disallowed ones while keeping their inner text.
  s = s.replace(
    /<(\/?)([a-zA-Z0-9]+)([^>]*)>/g,
    (_m, close: string, tagRaw: string, attrs: string) => {
      const tag = tagRaw.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (close) return `</${tag}>`;
      if (tag === "a") {
        const href = safeHref(attrs);
        return href
          ? `<a href="${href}" rel="noopener noreferrer" target="_blank">`
          : "<a>";
      }
      return `<${tag}>`;
    }
  );

  // Collapse empty paragraphs/divs left behind.
  s = s.replace(/<(p|div)>\s*<\/\1>/gi, "");
  return s.trim();
}

/** True when the sanitized HTML has no visible text or structural content. */
export function isEmptyHtml(html: string | null | undefined): boolean {
  if (!html) return true;
  const stripped = html
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, "")
    .trim();
  return stripped.length === 0;
}
