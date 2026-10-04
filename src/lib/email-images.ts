/**
 * Apple Mail on iPhone sizes an <img> from its width attribute. width="100%"
 * is not a pixel length, so iOS resolves it against the viewport. A wide photo
 * then paints to the screen edge while the header card and the text stay inset.
 *
 * What holds in Apple Mail:
 * - a nested table set to width:100% with a pixel max-width (the card column)
 * - a cell with overflow:hidden, so the file's intrinsic size cannot widen it
 * - an img width attribute in pixels, plus style width:100%; max-width:100%
 */

/** Letter shell body column (600px shell, 48px padding each side). */
export const LETTER_IMAGE_PX = 504;

/** Studio shell. The teal header and the white card share this inset. */
export const STUDIO_GUTTER_PX = 22;
export const STUDIO_CARD_PX = 600 - STUDIO_GUTTER_PX * 2; // 556

/** In-body photos use the same horizontal padding as the greeting. */
export const STUDIO_BODY_PAD_PX = 26;
export const STUDIO_BODY_IMAGE_PX = STUDIO_CARD_PX - STUDIO_BODY_PAD_PX * 2; // 504

/** Two-up row: 4px between the pair. */
export const STUDIO_BODY_HALF_PX = Math.floor((STUDIO_BODY_IMAGE_PX - 8) / 2); // 248

function pixelWidthAttr(tag: string): number | null {
  const m = tag.match(/\bwidth\s*=\s*(?:"(\d+)"|'(\d+)'|(\d+)(?=[\s>/]))/i);
  if (!m) return null;
  const n = Number(m[1] ?? m[2] ?? m[3]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function attrValue(tag: string, name: string): string {
  const m = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")
  );
  return m?.[2] ?? m?.[3] ?? m?.[4] ?? "";
}

function quoteAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}

/** True when this img already carries a pixel width and a percentage cap. */
function isConstrained(tag: string): boolean {
  return (
    pixelWidthAttr(tag) != null &&
    /max-width\s*:\s*100%/i.test(tag) &&
    /display\s*:\s*block/i.test(tag)
  );
}

/**
 * One photo, clipped to `width` pixels and fluid inside a narrower column.
 * `src` and `alt` must already be escaped for HTML.
 */
export function emailImageHtml(opts: {
  src: string;
  width: number;
  alt?: string;
  /** Extra declarations on the img (a trailing semicolon is added if needed). */
  styleExtra?: string;
  /** Extra declarations on the wrapper table (spacing in the letter shell). */
  tableStyleExtra?: string;
}): string {
  const w = opts.width;
  const alt = quoteAttr(opts.alt ?? "");
  const src = quoteAttr(opts.src);
  const extra = opts.styleExtra
    ? opts.styleExtra.endsWith(";")
      ? opts.styleExtra
      : `${opts.styleExtra};`
    : "";
  const tableExtra = opts.tableStyleExtra
    ? opts.tableStyleExtra.endsWith(";")
      ? opts.tableStyleExtra
      : `${opts.tableStyleExtra};`
    : "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:${w}px;${tableExtra}"><tbody><tr><td width="100%" valign="top" style="max-width:${w}px;overflow:hidden;font-size:0;line-height:0;mso-line-height-rule:exactly;"><img class="joy-photo" src="${src}" width="${w}" alt="${alt}" border="0" style="display:block;width:100%;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;${extra}"></td></tr></tbody></table>`;
}

function preservedRadius(tag: string): string {
  const radius = tag.match(/border-radius\s*:\s*[^;"]+/i);
  return radius ? `${radius[0]};` : "";
}

function columnWidthFor(tag: string, columnWidth: number): number {
  const existing = pixelWidthAttr(tag);
  // A small explicit width (a badge, an icon) stays that size. Anything
  // missing, percentage, or wider than the column is capped at the column.
  if (existing && existing < columnWidth) return existing;
  return columnWidth;
}

/**
 * Rewrite content images (Markdown letters and HTML dropped into the letter
 * shell) so the next note cannot overflow the card the way a raw img does.
 * Block photos become a clipping table. Images that are already constrained
 * are left alone.
 */
export function constrainContentImages(html: string, columnWidth: number): string {
  const block = (tag: string) =>
    emailImageHtml({
      src: attrValue(tag, "src"),
      alt: attrValue(tag, "alt"),
      width: columnWidthFor(tag, columnWidth),
      styleExtra: preservedRadius(tag),
      tableStyleExtra: "margin:6px 0 22px 0;",
    });

  let out = html.replace(
    /<p\b[^>]*>\s*(<img\b[^>]*>)\s*<\/p>/gi,
    (_m, img: string) => (isConstrained(img) ? _m : block(img))
  );
  out = out.replace(/<img\b[^>]*>/gi, (img) => {
    if (isConstrained(img)) return img;
    return block(img);
  });
  return out;
}
