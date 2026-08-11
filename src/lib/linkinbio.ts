import { cache } from "react";
import { hasDatabase, query } from "./db";
import { BUSINESS, BUSINESS_ADDRESS_ONE_LINE } from "./site";
import { toTelHref } from "./settings";

/**
 * Link-in-bio page content (the Instagram/Facebook bio landing page at /links,
 * edited from /admin/links). Stored as one JSON blob in site_settings under a
 * single key, so staff can edit links and one-line notes without a developer.
 *
 * Two project rules override the design handoff and are enforced here:
 *  - ONE tour path (AGENTS.md): the "Book a tour" button always routes to the
 *    canonical /tour page (which houses the single TalkFurther button). The
 *    tour destination is NOT an editable field, so a second tour link can't
 *    drift in. The button label stays editable.
 *  - Voice + compliance (§2/§4): every editable string is linted on save (no
 *    "assisted living", no em-dashes, no banned words). The license line in the
 *    footer is fixed and never editable.
 */

export const LINKINBIO_KEY = "linkinbio_content";

export type LinkRow = { label: string; note: string; href: string };

export type LinkInBioContent = {
  siteLabel: string;
  siteHref: string;
  tourLabel: string;
  callLabel: string;
  callHref: string;
  dirLabel: string;
  dirHref: string;
  /** Optional candid photo. Empty ships the page WITHOUT a photo (never stock). */
  photoUrl: string;
  photoCaption: string;
  trust: LinkRow[]; // capped at 3
  community: LinkRow[]; // capped at 2
  footAddress: string;
  footPhone: string;
};

/** The canonical, non-editable tour destination (the site's one tour path). */
export const LINKINBIO_TOUR_HREF = "/tour";

/** The fixed regulatory line in the footer (never editable). */
export const LINKINBIO_LICENSE_LINE =
  "Licensed personal care home, State of Georgia.";

const mapsHref = `https://maps.google.com/?q=${encodeURIComponent(
  BUSINESS_ADDRESS_ONE_LINE
)}`;

export function linkInBioDefaults(): LinkInBioContent {
  return {
    siteLabel: "Learn more about Joy",
    siteHref: "https://www.joyseniorcare.com",
    tourLabel: "Book a tour",
    callLabel: `Call us: ${BUSINESS.phone}`,
    callHref: toTelHref(BUSINESS.phone),
    dirLabel: "Get directions",
    dirHref: mapsHref,
    photoUrl: "",
    photoCaption: "late light on the front porch",
    trust: [
      {
        label: "Meet Mellissa and our team",
        note: "2026 Best of Senior Living Award",
        href: "/about",
      },
      {
        label: "Read our latest post",
        note: "Stories from the house",
        href: "/blog",
      },
      {
        label: "Read our Google reviews",
        note: "See what families say",
        href: "/reviews",
      },
    ],
    community: [
      // Caregiver support group: no page yet, so its link is blank by default
      // and the row is hidden until a real destination is added (no fake links).
      {
        label: "Caregiver support group",
        note: "Free. Monthly. Open to the community.",
        href: "",
      },
      { label: "Careers at Joy", note: "", href: "" },
    ],
    footAddress: BUSINESS_ADDRESS_ONE_LINE,
    footPhone: BUSINESS.phone,
  };
}

/** Domain chip: the URL's hostname with a leading www. stripped. */
export function deriveDomain(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

/** Merge a stored (possibly partial) blob over the defaults. */
function coerce(stored: Partial<LinkInBioContent> | null): LinkInBioContent {
  const d = linkInBioDefaults();
  if (!stored || typeof stored !== "object") return d;
  const rows = (
    incoming: unknown,
    fallback: LinkRow[],
    cap: number
  ): LinkRow[] => {
    if (!Array.isArray(incoming)) return fallback;
    return incoming.slice(0, cap).map((r) => ({
      label: typeof r?.label === "string" ? r.label : "",
      note: typeof r?.note === "string" ? r.note : "",
      href: typeof r?.href === "string" ? r.href : "",
    }));
  };
  return {
    siteLabel: stored.siteLabel ?? d.siteLabel,
    siteHref: stored.siteHref ?? d.siteHref,
    tourLabel: stored.tourLabel ?? d.tourLabel,
    callLabel: stored.callLabel ?? d.callLabel,
    callHref: stored.callHref ?? d.callHref,
    dirLabel: stored.dirLabel ?? d.dirLabel,
    dirHref: stored.dirHref ?? d.dirHref,
    photoUrl: stored.photoUrl ?? d.photoUrl,
    photoCaption: stored.photoCaption ?? d.photoCaption,
    trust: rows(stored.trust, d.trust, 3),
    community: rows(stored.community, d.community, 2),
    footAddress: stored.footAddress ?? d.footAddress,
    footPhone: stored.footPhone ?? d.footPhone,
  };
}

/** Read the link-in-bio content, merged over defaults. Cached per request. */
export const getLinkInBio = cache(async (): Promise<LinkInBioContent> => {
  if (!hasDatabase()) return linkInBioDefaults();
  try {
    const rows = await query<{ value: string }>(
      `SELECT value FROM site_settings WHERE key = $1`,
      [LINKINBIO_KEY]
    );
    if (!rows.length || !rows[0].value) return linkInBioDefaults();
    return coerce(JSON.parse(rows[0].value));
  } catch {
    return linkInBioDefaults();
  }
});

/** Persist the whole content blob under the single key. */
export async function saveLinkInBio(content: LinkInBioContent): Promise<void> {
  await query(
    `INSERT INTO site_settings (key, value, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [LINKINBIO_KEY, JSON.stringify(content)]
  );
}

/** Delete the stored blob so the page falls back to the shipped defaults. */
export async function resetLinkInBio(): Promise<void> {
  await query(`DELETE FROM site_settings WHERE key = $1`, [LINKINBIO_KEY]);
}

/* ------------------------- validation + voice lint ------------------------ */

const BANNED = [
  "loved ones",
  "vibrant",
  "journey",
  "boutique",
  "intimate",
  "personalized care plans",
];

/** A link is valid when empty, http(s), tel:, mailto:, or site-relative (/…). */
function badLink(value: string): boolean {
  const v = value.trim();
  if (v === "") return false; // empty is allowed (row hidden)
  if (v.startsWith("/")) return false;
  try {
    const proto = new URL(v).protocol;
    return !["http:", "https:", "tel:", "mailto:"].includes(proto);
  } catch {
    return true;
  }
}

/**
 * Enforce voice/compliance (§2/§4) on the editable copy and validate links.
 * Returns an error string, or null when everything passes.
 */
export function validateLinkInBio(content: LinkInBioContent): string | null {
  const copy: string[] = [
    content.siteLabel,
    content.tourLabel,
    content.callLabel,
    content.dirLabel,
    content.photoCaption,
    ...content.trust.flatMap((r) => [r.label, r.note]),
    ...content.community.flatMap((r) => [r.label, r.note]),
    content.footAddress,
    content.footPhone,
  ];

  for (const s of copy) {
    const lower = s.toLowerCase();
    if (lower.includes("assisted living")) {
      return 'Please remove "assisted living". Joy is a personal care home.';
    }
    if (s.includes("—")) {
      return "Please remove the em-dash (use parentheses or a period instead).";
    }
    const hit = BANNED.find((b) => lower.includes(b));
    if (hit) return `Please remove the word "${hit}" (house voice rule).`;
  }

  const links: [string, string][] = [
    ["Website link", content.siteHref],
    ["Call link", content.callHref],
    ["Directions link", content.dirHref],
    ["Photo URL", content.photoUrl],
    ...content.trust.map(
      (r, i) => [`Trust link ${i + 1}`, r.href] as [string, string]
    ),
    ...content.community.map(
      (r, i) => [`Community link ${i + 1}`, r.href] as [string, string]
    ),
  ];
  for (const [name, href] of links) {
    if (badLink(href)) {
      return `${name} must be a link (https://…, /page, tel:…, or mailto:…).`;
    }
  }

  return null;
}
