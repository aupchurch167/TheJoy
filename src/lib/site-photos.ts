import { cache } from "react";
import { hasDatabase, query } from "./db";
import { HERO_PHOTO, MELLISSA, COMMUNITY_PHOTOS } from "./site";

/**
 * Admin-editable site photos. The key marketing images (hero, Mellissa, the
 * community grid) can be replaced from /admin/photos without a code change.
 *
 * Storage: the site_settings key/value table, one key per slot (photo_*). The
 * stored value is just the image URL; the alt text stays curated in site.ts
 * (§2 voice), so an operator only swaps the picture. Empty/unset falls back to
 * the code default path, which shows the calm placeholder until a real file or
 * URL is provided.
 */

export type PhotoSlotKey =
  | "hero"
  | "mellissa"
  | "community_1"
  | "community_2"
  | "community_3"
  | "community_4";

export type PhotoSlot = {
  key: PhotoSlotKey;
  settingKey: string;
  label: string;
  hint: string;
  defaultSrc: string;
  alt: string;
  /** Tailwind aspect ratio for the admin preview + public render. */
  aspect: string;
};

export const SITE_PHOTO_SLOTS: PhotoSlot[] = [
  {
    key: "hero",
    settingKey: "photo_hero",
    label: "Homepage hero",
    hint: "The large photo beside the headline. A wide shot of the building works well.",
    defaultSrc: HERO_PHOTO.src,
    alt: HERO_PHOTO.alt,
    aspect: "aspect-[4/3]",
  },
  {
    key: "mellissa",
    settingKey: "photo_mellissa",
    label: "Mellissa's portrait",
    hint: "A friendly portrait of Mellissa for the Meet Mellissa section.",
    defaultSrc: MELLISSA.photo,
    alt: `${MELLISSA.heading}, Executive Director at Joy Senior Living`,
    aspect: "aspect-[4/5]",
  },
  ...COMMUNITY_PHOTOS.slice(0, 4).map((p, i) => ({
    key: `community_${i + 1}` as PhotoSlotKey,
    settingKey: `photo_community_${i + 1}`,
    label: `Community photo ${i + 1}`,
    hint: p.alt,
    defaultSrc: p.src,
    alt: p.alt,
    aspect: "aspect-square",
  })),
];

export type ResolvedPhoto = { src: string; alt: string };
export type SitePhotos = {
  hero: ResolvedPhoto;
  mellissa: ResolvedPhoto;
  community: ResolvedPhoto[];
};

/** Read stored photo overrides (settingKey -> url). Empty map with no DB. */
async function readOverrides(): Promise<Map<string, string>> {
  if (!hasDatabase()) return new Map();
  try {
    const keys = SITE_PHOTO_SLOTS.map((s) => s.settingKey);
    const rows = await query<{ key: string; value: string }>(
      `SELECT key, value FROM site_settings WHERE key = ANY($1)`,
      [keys]
    );
    return new Map(rows.map((r) => [r.key, r.value]));
  } catch {
    return new Map();
  }
}

/** Raw stored value per slot (for the admin form). "" when unset. */
export const getSitePhotoOverrides = cache(
  async (): Promise<Record<string, string>> => {
    const map = await readOverrides();
    const out: Record<string, string> = {};
    for (const s of SITE_PHOTO_SLOTS) out[s.settingKey] = map.get(s.settingKey) || "";
    return out;
  }
);

/** Resolved photos (override url or the code default), for the public site. */
export const getSitePhotos = cache(async (): Promise<SitePhotos> => {
  const map = await readOverrides();
  const src = (slot: PhotoSlot) => map.get(slot.settingKey) || slot.defaultSrc;
  const bySlot = (k: PhotoSlotKey) => SITE_PHOTO_SLOTS.find((s) => s.key === k)!;
  const hero = bySlot("hero");
  const mellissa = bySlot("mellissa");
  return {
    hero: { src: src(hero), alt: hero.alt },
    mellissa: { src: src(mellissa), alt: mellissa.alt },
    community: SITE_PHOTO_SLOTS.filter((s) => s.key.startsWith("community")).map(
      (s) => ({ src: src(s), alt: s.alt })
    ),
  };
});
