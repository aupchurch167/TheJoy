/**
 * Client-safe settings metadata and validators (no database imports), so both
 * client components (the admin form) and server code can use them.
 */

export const SETTING_KEYS = [
  "phone",
  "email",
  "address",
  "careers_url",
  "tour_use_talkfurther",
  "talkfurther_url",
  "sms_test_numbers",
  // Homepage
  "hero_headline",
  // Promotion banner (site-wide announcement bar)
  "promo_enabled",
  "promo_text",
  "promo_cta_label",
  "promo_cta_url",
  // Deposits (PayPal)
  "deposit_amount",
  "deposit_note",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

/** Keys that must be a valid http(s) URL when non-empty. */
export const URL_KEYS: SettingKey[] = [
  "careers_url",
  "talkfurther_url",
  "promo_cta_url",
];

/** Boolean keys, stored as "on" (true) or "" (false), rendered as a toggle. */
export const BOOL_KEYS: SettingKey[] = ["promo_enabled", "tour_use_talkfurther"];

/** Keys that may be left blank (optional). */
export const OPTIONAL_KEYS: SettingKey[] = [
  "careers_url",
  "tour_use_talkfurther",
  "talkfurther_url",
  "sms_test_numbers",
  "hero_headline",
  "promo_enabled",
  "promo_text",
  "promo_cta_label",
  "promo_cta_url",
  "deposit_amount",
  "deposit_note",
];

export type SettingType = "text" | "url" | "textarea" | "bool";

/** Human labels + hints + grouping for the admin screen. */
export const SETTING_META: Record<
  SettingKey,
  { label: string; hint?: string; type: SettingType; group: string }
> = {
  phone: { label: "Phone", type: "text", group: "Contact & links" },
  email: { label: "Email", type: "text", group: "Contact & links" },
  address: { label: "Address", type: "text", group: "Contact & links" },
  careers_url: {
    label: "Careers link (Indeed)",
    hint: "Where the Careers link points. Blank falls back to the current Indeed posting.",
    type: "url",
    group: "Contact & links",
  },
  tour_use_talkfurther: {
    label: "Use the TalkFurther scheduler for “Book a tour”",
    hint: "On: every Book-a-tour button opens your TalkFurther scheduler. Off: the buttons go to the on-site Tour page (contact form plus call Mellissa) instead.",
    type: "bool",
    group: "Contact & links",
  },
  talkfurther_url: {
    label: "Tour link (TalkFurther)",
    hint: "The TalkFurther scheduler link, used when the toggle above is on. Blank falls back to the on-site Tour page.",
    type: "url",
    group: "Contact & links",
  },
  sms_test_numbers: {
    label: "Text test numbers (owners & admin)",
    hint: "Comma-separated phone numbers. A text blast must be test-sent to these first; they get the required preview before any family blast.",
    type: "text",
    group: "Texting",
  },
  hero_headline: {
    label: "Homepage headline",
    hint: "The big line at the top of the homepage. Leave blank to use the built-in default.",
    type: "text",
    group: "Homepage",
  },
  promo_enabled: {
    label: "Show the promotion banner",
    hint: "Turn on to display a thin announcement bar at the very top of every page.",
    type: "bool",
    group: "Promotion banner",
  },
  promo_text: {
    label: "Promotion message",
    hint: "What the banner says, e.g. “July special: one week of respite care, on us, for new families.” Keep it to a sentence.",
    type: "textarea",
    group: "Promotion banner",
  },
  promo_cta_label: {
    label: "Banner button text (optional)",
    hint: "e.g. “Book a tour” or “Call us”. Leave blank for no button.",
    type: "text",
    group: "Promotion banner",
  },
  promo_cta_url: {
    label: "Banner button link (optional)",
    hint: "Where the button goes (a full https:// link, or a page like /services). Leave blank for no button.",
    type: "url",
    group: "Promotion banner",
  },
  deposit_amount: {
    label: "Default deposit amount (USD)",
    hint: "Pre-fills the amount on the Deposits screen. You can change it for each request before sending. Numbers only, e.g. 500 or 750.00.",
    type: "text",
    group: "Deposits (PayPal)",
  },
  deposit_note: {
    label: "Deposit invoice note (optional)",
    hint: "A short line shown to the family on every deposit invoice, e.g. what the deposit holds. Leave blank for none.",
    type: "textarea",
    group: "Deposits (PayPal)",
  },
};

export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validate one key/value. URL keys accept an http(s) link, a site-relative
 * path (starting with "/"), a tel:/mailto: link, or empty. Optional keys may
 * be empty; required keys cannot.
 */
export function validateSetting(key: string, value: string): string | null {
  const v = value.trim();
  if ((URL_KEYS as string[]).includes(key)) {
    if (v === "") return null; // empty allowed
    if (v.startsWith("/")) return null; // site-relative path (e.g. /services)
    try {
      const proto = new URL(v).protocol;
      if (["http:", "https:", "tel:", "mailto:"].includes(proto)) return null;
    } catch {
      // fall through to the error below
    }
    return `${key} must be a link (https://…, /page, tel:…, or mailto:…).`;
  }
  if (key === "deposit_amount") {
    if (v === "") return null; // empty falls back to the built-in default
    const cleaned = v.replace(/[$,\s]/g, "");
    if (!/^\d+(\.\d{1,2})?$/.test(cleaned) || parseFloat(cleaned) <= 0) {
      return "Default deposit amount must be a positive number (e.g. 500 or 750.00).";
    }
    return null;
  }
  if (v === "" && (OPTIONAL_KEYS as string[]).includes(key)) return null;
  if (v === "") return `${key} cannot be empty.`;
  return null;
}
