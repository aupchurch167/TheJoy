import { BUSINESS, BUSINESS_ADDRESS_ONE_LINE } from "./site";

/**
 * Link-in-bio v2: a profile header + an ordered list of typed blocks (the
 * Instagram/Facebook bio landing page at /links, edited at /admin/links).
 *
 * This module is PURE (no DB import) so the client editor can share the types,
 * factories, validation, and helpers. The server half (read/save/migrate/click
 * counts) lives in linkinbio.ts, which re-exports everything here.
 *
 * Two project rules override the design handoff and are enforced in validation:
 *  - ONE tour path (AGENTS.md): the tour link block is pinned to /tour; only its
 *    title is editable, never its URL, so a second tour link can't drift in.
 *  - Voice + compliance (§2/§4): every editable string is linted (no "assisted
 *    living", no em-dashes, no banned words).
 */

/* ------------------------------- types --------------------------------- */

export type LinkColor = "blue" | "green";
export type LinkStyle = "plain" | "outlined" | "filled";

export type SocialKey = "ig" | "fb" | "tt" | "em";
export type SocialItem = {
  key: SocialKey;
  label: string;
  url: string;
  enabled: boolean;
};

export type LinkBlock = {
  id: string;
  type: "link";
  title: string;
  url: string;
  subtitle: string;
  domain?: string;
  color: LinkColor;
  style: LinkStyle;
  active: boolean;
  showThumb: boolean;
  thumbUrl?: string;
  schedStart?: string; // ISO date (YYYY-MM-DD), optional
  schedEnd?: string;
  /** "tour" pins this link to the canonical /tour path (URL locked). */
  pinned?: "tour";
};
export type HeaderBlock = { id: string; type: "header"; text: string; active: boolean };
export type SocialBlock = {
  id: string;
  type: "social";
  active: boolean;
  items: SocialItem[];
};
export type GalleryBlock = {
  id: string;
  type: "gallery";
  active: boolean;
  images: [string, string, string];
};
export type BlogBlock = { id: string; type: "blog"; active: boolean; heading: string };
export type FormBlock = {
  id: string;
  type: "form";
  active: boolean;
  heading: string;
  blurb: string;
};

export type Block =
  | LinkBlock
  | HeaderBlock
  | SocialBlock
  | GalleryBlock
  | BlogBlock
  | FormBlock;

export type LinkInBioProfile = {
  name: string;
  bio: string;
  photoUrl: string;
  photoCaption: string;
};

export type LinkInBioContentV2 = {
  profile: LinkInBioProfile;
  blocks: Block[];
};

/* ---------------------------- constants -------------------------------- */

/** The canonical, non-editable tour destination (the site's one tour path). */
export const LINKINBIO_TOUR_HREF = "/tour";

/** The fixed regulatory line in the footer (never editable). */
export const LINKINBIO_LICENSE_LINE =
  "Licensed personal care home, State of Georgia.";

export const LINK_COLORS: { key: LinkColor; label: string; hex: string }[] = [
  { key: "blue", label: "Blue", hex: "#01a7ce" },
  { key: "green", label: "Green", hex: "#24a332" },
];

export const LINK_STYLES: { key: LinkStyle; label: string }[] = [
  { key: "plain", label: "Plain" },
  { key: "outlined", label: "Outlined" },
  { key: "filled", label: "Filled" },
];

export const SOCIAL_PLATFORMS: { key: SocialKey; label: string; glyph: string }[] = [
  { key: "ig", label: "Instagram", glyph: "IG" },
  { key: "fb", label: "Facebook", glyph: "f" },
  { key: "tt", label: "TikTok", glyph: "♪" },
  { key: "em", label: "Email", glyph: "✉" },
];

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/* ------------------------------ factories ------------------------------ */

let seq = 0;
export function newBlockId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `b${Date.now()}_${++seq}`;
}

export function newLinkBlock(): LinkBlock {
  return {
    id: newBlockId(),
    type: "link",
    title: "New link",
    url: "",
    subtitle: "",
    domain: "",
    color: "blue",
    style: "plain",
    active: true,
    showThumb: false,
    thumbUrl: "",
    schedStart: "",
    schedEnd: "",
  };
}
export function newHeaderBlock(): HeaderBlock {
  return { id: newBlockId(), type: "header", text: "New section", active: true };
}
export function newSocialBlock(): SocialBlock {
  return {
    id: newBlockId(),
    type: "social",
    active: true,
    items: SOCIAL_PLATFORMS.map((p) => ({
      key: p.key,
      label: p.label,
      url: "",
      enabled: false,
    })),
  };
}
export function newGalleryBlock(): GalleryBlock {
  return { id: newBlockId(), type: "gallery", active: true, images: ["", "", ""] };
}
export function newBlogBlock(): BlogBlock {
  return { id: newBlockId(), type: "blog", active: true, heading: "From the blog" };
}
export function newFormBlock(): FormBlock {
  return {
    id: newBlockId(),
    type: "form",
    active: true,
    heading: "Have a question?",
    blurb: "Send a short note and Mellissa will get back to you. Or call anytime.",
  };
}

/* ------------------------------ defaults ------------------------------- */

export function linkInBioV2Defaults(): LinkInBioContentV2 {
  const mapsHref = `https://maps.google.com/?q=${encodeURIComponent(
    BUSINESS_ADDRESS_ONE_LINE
  )}`;
  const link = (over: Partial<LinkBlock>): LinkBlock => ({
    ...newLinkBlock(),
    ...over,
  });
  const blocks: Block[] = [
      link({
        title: "Learn more about Joy",
        url: "https://www.joyseniorcare.com",
        domain: "joyseniorcare.com",
        style: "plain",
      }),
      link({ title: "Book a tour", url: LINKINBIO_TOUR_HREF, style: "filled", pinned: "tour" }),
      link({ title: `Call us: ${BUSINESS.phone}`, url: telHref(BUSINESS.phone), style: "filled" }),
      link({ title: "Get directions", url: mapsHref, style: "filled" }),
      newHeaderBlock2("Trust & community"),
      link({
        title: "Meet Mellissa and our team",
        url: "/about",
        subtitle: "2026 Best of Senior Living Award",
        color: "green",
      }),
      link({
        title: "Read our Google reviews",
        url: "/reviews",
        subtitle: "See what families say",
        color: "green",
      }),
      newBlogBlock(),
      {
        ...newSocialBlock(),
        items: [
          { key: "ig", label: "Instagram", url: "https://instagram.com/joyseniorcare", enabled: true },
          { key: "fb", label: "Facebook", url: "https://facebook.com/joyseniorcare", enabled: true },
          { key: "tt", label: "TikTok", url: "", enabled: false },
          { key: "em", label: "Email", url: BUSINESS.emailHref, enabled: true },
        ],
      },
      newFormBlock(),
  ];
  return {
    profile: {
      name: "Joy Senior Living",
      bio: "A 24-bed personal care home in Loganville. Small enough to know her.",
      photoUrl: "",
      photoCaption: "late light on the front porch",
    },
    // Deterministic ids so click counts and /l/<id> links stay stable across
    // reads before the editor is ever saved (editor-added blocks get random ids).
    blocks: blocks.map((b, i) => ({ ...b, id: `def-${i}` })),
  };
}

function newHeaderBlock2(text: string): HeaderBlock {
  return { id: newBlockId(), type: "header", text, active: true };
}

/* ------------------------------ helpers -------------------------------- */

/** Domain chip: the URL's hostname with a leading www. stripped. */
export function deriveDomain(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

/** Today as YYYY-MM-DD (local). */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * A block is live (shown publicly) when active and, for links, within its
 * optional schedule window. Compute this server-side so scheduled links never
 * leak before/after their window.
 */
export function isBlockLive(block: Block, today = todayISO()): boolean {
  if (!block.active) return false;
  if (block.type === "link") {
    if (block.schedStart && today < block.schedStart) return false;
    if (block.schedEnd && today > block.schedEnd) return false;
  }
  return true;
}

/** External http(s) links open in a new tab; internal/tel/mailto stay in-tab. */
export function targetProps(href: string) {
  return /^https?:\/\//i.test(href)
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};
}

/* ---------------------- validation + voice lint ------------------------ */

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
  const v = (value || "").trim();
  if (v === "") return false;
  if (v.startsWith("/")) return false;
  try {
    const proto = new URL(v).protocol;
    return !["http:", "https:", "tel:", "mailto:"].includes(proto);
  } catch {
    return true;
  }
}

function lintCopy(s: string): string | null {
  const lower = (s || "").toLowerCase();
  if (lower.includes("assisted living")) {
    return 'Please remove "assisted living". Joy is a personal care home.';
  }
  if ((s || "").includes("—")) {
    return "Please remove the em-dash (use parentheses or a period instead).";
  }
  const hit = BANNED.find((b) => lower.includes(b));
  if (hit) return `Please remove the word "${hit}" (house voice rule).`;
  return null;
}

/**
 * Enforce voice/compliance on all editable copy and validate every link shape.
 * Returns an error string, or null when everything passes. Also the place the
 * tour-pin rule is enforced (pinned tour URL must be /tour).
 */
export function validateLinkInBioV2(content: LinkInBioContentV2): string | null {
  const strings: string[] = [content.profile.name, content.profile.bio, content.profile.photoCaption];
  const links: [string, string][] = [["Profile photo", content.profile.photoUrl]];

  for (const b of content.blocks) {
    if (b.type === "link") {
      strings.push(b.title, b.subtitle, b.domain ?? "");
      links.push([`Link "${b.title || "untitled"}"`, b.url]);
      if (b.showThumb && b.thumbUrl) links.push([`Thumbnail for "${b.title}"`, b.thumbUrl]);
      if (b.pinned === "tour" && b.url.trim() !== LINKINBIO_TOUR_HREF) {
        return "The tour button always links to /tour (that is the site's one tour path).";
      }
    } else if (b.type === "header") {
      strings.push(b.text);
    } else if (b.type === "social") {
      b.items.forEach((it, i) => links.push([`${it.label || `Social ${i + 1}`} link`, it.url]));
    } else if (b.type === "gallery") {
      b.images.forEach((u, i) => links.push([`Gallery photo ${i + 1}`, u]));
    } else if (b.type === "blog") {
      strings.push(b.heading);
    } else if (b.type === "form") {
      strings.push(b.heading, b.blurb);
    }
  }

  for (const s of strings) {
    const err = lintCopy(s);
    if (err) return err;
  }
  for (const [name, href] of links) {
    if (badLink(href)) {
      return `${name} must be a link (https://…, /page, tel:…, or mailto:…).`;
    }
  }
  return null;
}
