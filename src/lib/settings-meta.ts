/**
 * Client-safe settings metadata and validators (no database imports), so both
 * client components (the admin form) and server code can use them.
 */

export const SETTING_KEYS = [
  "phone",
  "email",
  "address",
  "careers_url",
  "talkfurther_url",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

/** Keys that must be a valid http(s) URL when non-empty. */
export const URL_KEYS: SettingKey[] = ["careers_url", "talkfurther_url"];

/** Human labels + hints for the admin screen. */
export const SETTING_META: Record<
  SettingKey,
  { label: string; hint?: string; type: "text" | "url" }
> = {
  phone: { label: "Phone", type: "text" },
  email: { label: "Email", type: "text" },
  address: { label: "Address", type: "text" },
  careers_url: {
    label: "Careers link (Indeed)",
    hint: "Where the Careers link points. Leave blank to hide the link.",
    type: "url",
  },
  talkfurther_url: {
    label: "Tour link (TalkFurther)",
    hint: "The single Book-a-tour destination. Blank falls back to the phone number.",
    type: "url",
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

/** Validate one key/value (URL keys http(s) or empty; others non-empty). */
export function validateSetting(key: string, value: string): string | null {
  const v = value.trim();
  if ((URL_KEYS as string[]).includes(key)) {
    if (v === "") return null; // empty allowed (e.g. hides the careers link)
    if (!isValidHttpUrl(v)) return `${key} must be a valid http(s) URL.`;
    return null;
  }
  if (v === "") return `${key} cannot be empty.`;
  return null;
}
