import { cache } from "react";
import { hasDatabase, query } from "./db";
import { BUSINESS, BUSINESS_ADDRESS_ONE_LINE, TOUR_URL } from "./site";
import { SETTING_KEYS, URL_KEYS, type SettingKey } from "./settings-meta";

/**
 * Admin-editable site settings (Change Set 01). A key/value store so contact
 * facts, the careers link, and the tour link can change without a redeploy.
 *
 * getSettings() merges DB rows over sensible defaults and degrades gracefully
 * when there is no database. It is React-cached, so the many components that
 * read it (header, footer, pages) share one query per request.
 *
 * Pure metadata + validators live in ./settings-meta (client-safe).
 */

export type SiteSettings = Record<SettingKey, string>;

/**
 * The live Indeed posting Joy hires through. Individual Indeed jobs expire,
 * so when this one closes, paste the new posting URL in the admin Site
 * Settings screen (no redeploy needed). This is only the fallback default.
 */
const CAREERS_URL_DEFAULT =
  "https://www.indeed.com/job/med-tech-efa0e5aba40389f4";

function defaults(): SiteSettings {
  return {
    phone: BUSINESS.phone,
    email: BUSINESS.email,
    address: BUSINESS_ADDRESS_ONE_LINE,
    careers_url: CAREERS_URL_DEFAULT,
    // Falls back to the env/phone tour path when no setting is stored.
    talkfurther_url: TOUR_URL,
  };
}

/** Read all settings, merged over defaults. Cached per request. */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  const d = defaults();
  if (!hasDatabase()) return d;
  try {
    const rows = await query<{ key: string; value: string }>(
      `SELECT key, value FROM site_settings`
    );
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const get = (k: SettingKey) => map.get(k);
    return {
      phone: get("phone") || d.phone,
      email: get("email") || d.email,
      address: get("address") || d.address,
      // careers_url: empty falls back to the default Indeed posting.
      careers_url: get("careers_url") || d.careers_url,
      // talkfurther_url: empty falls back to the default tour path.
      talkfurther_url: get("talkfurther_url") || d.talkfurther_url,
    };
  } catch {
    return d;
  }
});

/** All rows for the admin form (every known key shows, even if unset in DB). */
export async function getAllSettings(): Promise<
  { key: SettingKey; value: string }[]
> {
  const d = defaults();
  let stored = new Map<string, string>();
  if (hasDatabase()) {
    try {
      const rows = await query<{ key: string; value: string }>(
        `SELECT key, value FROM site_settings`
      );
      stored = new Map(rows.map((r) => [r.key, r.value]));
    } catch {
      // fall through to defaults
    }
  }
  return SETTING_KEYS.map((key) => ({
    key,
    // careers_url / talkfurther_url default to blank in the editor.
    value: stored.get(key) ?? (URL_KEYS.includes(key) ? "" : d[key]),
  }));
}

/** Upsert many settings at once. */
export async function saveSettings(
  entries: { key: string; value: string }[]
): Promise<void> {
  for (const { key, value } of entries) {
    await query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [key, value.trim()]
    );
  }
}

/** Build a tel: href from a display phone number. */
export function toTelHref(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return `tel:${digits}`;
}

export function toMailHref(email: string): string {
  return `mailto:${email}`;
}
