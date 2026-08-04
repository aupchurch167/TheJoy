import { cache } from "react";
import { hasDatabase, query } from "./db";
import {
  HERO_PHOTO,
  MELLISSA,
  COMMUNITY_PHOTOS,
  HOME_SECTION_PHOTOS,
  SERVICE_DETAILS,
} from "./site";

/** site_settings key for a service's photo (slug dashes become underscores). */
export function servicePhotoSettingKey(slug: string): string {
  return `photo_service_${slug.replace(/-/g, "_")}`;
}

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
  | "tuesday"
  | "home_services"
  | "cta"
  | `community_${number}`
  | `service_${string}`;

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
  ...COMMUNITY_PHOTOS.map((p, i) => ({
    key: `community_${i + 1}` as PhotoSlotKey,
    settingKey: `photo_community_${i + 1}`,
    label: `Inside the home photo ${i + 1}`,
    hint: p.alt,
    defaultSrc: p.src,
    alt: p.alt,
    aspect: "aspect-square",
  })),
  {
    key: "tuesday",
    settingKey: "photo_tuesday",
    label: "Homepage: A Tuesday at Joy",
    hint: "A warm photo beside the daily-rhythm section (e.g. breakfast, morning light).",
    defaultSrc: HOME_SECTION_PHOTOS.tuesday.src,
    alt: HOME_SECTION_PHOTOS.tuesday.alt,
    aspect: "aspect-[4/5]",
  },
  {
    key: "home_services",
    settingKey: "photo_home_services",
    label: "Homepage: What we handle",
    hint: "A care / daily-life photo beside the “What we handle” list.",
    defaultSrc: HOME_SECTION_PHOTOS.services.src,
    alt: HOME_SECTION_PHOTOS.services.alt,
    aspect: "aspect-[4/5]",
  },
  {
    key: "cta",
    settingKey: "photo_cta",
    label: "Homepage: Come see the home",
    hint: "A building or exterior shot next to the contact form.",
    defaultSrc: HOME_SECTION_PHOTOS.cta.src,
    alt: HOME_SECTION_PHOTOS.cta.alt,
    aspect: "aspect-[3/2]",
  },
  // One slot per service, so the Services page photos are admin-editable too.
  ...SERVICE_DETAILS.map((s) => ({
    key: `service_${s.slug}` as PhotoSlotKey,
    settingKey: servicePhotoSettingKey(s.slug),
    label: `Service: ${s.name}`,
    hint: `Photo for the ${s.name} card and page. ${s.photo.alt}`,
    defaultSrc: s.photo.src,
    alt: s.photo.alt,
    aspect: "aspect-[4/3]",
  })),
];

export type ResolvedPhoto = { src: string; alt: string };
export type SitePhotos = {
  hero: ResolvedPhoto;
  mellissa: ResolvedPhoto;
  community: ResolvedPhoto[];
  tuesday: ResolvedPhoto;
  homeServices: ResolvedPhoto;
  cta: ResolvedPhoto;
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

/**
 * Resolved service photos as a map (slug -> {src, alt}). Uses the admin
 * override when set, else the code default (which shows the calm placeholder
 * until a real file exists). One DB read, cached per request.
 */
export const getServicePhotos = cache(
  async (): Promise<Map<string, ResolvedPhoto>> => {
    const map = await readOverrides();
    const out = new Map<string, ResolvedPhoto>();
    for (const s of SERVICE_DETAILS) {
      const key = servicePhotoSettingKey(s.slug);
      out.set(s.slug, { src: map.get(key) || s.photo.src, alt: s.photo.alt });
    }
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
  const tuesday = bySlot("tuesday");
  const homeServices = bySlot("home_services");
  const cta = bySlot("cta");
  return {
    hero: { src: src(hero), alt: hero.alt },
    mellissa: { src: src(mellissa), alt: mellissa.alt },
    community: SITE_PHOTO_SLOTS.filter((s) => s.key.startsWith("community")).map(
      (s) => ({ src: src(s), alt: s.alt })
    ),
    tuesday: { src: src(tuesday), alt: tuesday.alt },
    homeServices: { src: src(homeServices), alt: homeServices.alt },
    cta: { src: src(cta), alt: cta.alt },
  };
});
