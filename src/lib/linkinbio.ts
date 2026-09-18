import { cache } from "react";
import { hasDatabase, query } from "./db";
import {
  linkInBioV2Defaults,
  newLinkBlock,
  type Block,
  type LinkBlock,
  type LinkInBioContentV2,
} from "./linkinbio-shared";

/**
 * Server half of the link-in-bio v2 feature. Reads/saves the block list from
 * site_settings and counts click-throughs. The pure types/factories/validation
 * live in linkinbio-shared.ts (re-exported here); v1->v2 migration is below.
 */

/** Build a link block from partial fields. */
function newLinkFrom(over: Partial<LinkBlock>): LinkBlock {
  return { ...newLinkBlock(), ...over };
}

export * from "./linkinbio-shared";

/** New storage key for the v2 block model. */
export const LINKINBIO_V2_KEY = "linkinbio_blocks_v2";
/** Legacy key (v1 fixed-shape content), migrated on read. */
export const LINKINBIO_V1_KEY = "linkinbio_content";

async function readSetting(key: string): Promise<unknown | null> {
  const rows = await query<{ value: string }>(
    `SELECT value FROM site_settings WHERE key = $1`,
    [key]
  );
  if (!rows.length || !rows[0].value) return null;
  try {
    return JSON.parse(rows[0].value);
  } catch {
    return null;
  }
}

/** Light shape guard for a stored v2 blob. */
function isV2(v: unknown): v is LinkInBioContentV2 {
  return (
    !!v &&
    typeof v === "object" &&
    Array.isArray((v as LinkInBioContentV2).blocks) &&
    typeof (v as LinkInBioContentV2).profile === "object"
  );
}

/**
 * Read the link-in-bio content as v2 blocks, cached per request:
 *   1. the v2 blob if present,
 *   2. else migrate the v1 blob if present,
 *   3. else the shipped defaults.
 */
export const getLinkInBio = cache(async (): Promise<LinkInBioContentV2> => {
  if (!hasDatabase()) return linkInBioV2Defaults();
  try {
    const v2 = await readSetting(LINKINBIO_V2_KEY);
    if (isV2(v2)) return v2;
    const v1 = await readSetting(LINKINBIO_V1_KEY);
    if (v1 && typeof v1 === "object") return migrateFromV1(v1 as Record<string, unknown>);
    return linkInBioV2Defaults();
  } catch {
    return linkInBioV2Defaults();
  }
});

/** Persist the v2 block content under the new key. */
export async function saveLinkInBioV2(content: LinkInBioContentV2): Promise<void> {
  await query(
    `INSERT INTO site_settings (key, value, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [LINKINBIO_V2_KEY, JSON.stringify(content)]
  );
}

/** Delete stored content so the page falls back to shipped defaults. */
export async function resetLinkInBio(): Promise<void> {
  await query(`DELETE FROM site_settings WHERE key = ANY($1)`, [
    [LINKINBIO_V2_KEY, LINKINBIO_V1_KEY],
  ]);
}

/* ------------------------------ clicks --------------------------------- */

/** Click-through counts keyed by block id. */
export async function getClickCounts(): Promise<Record<string, number>> {
  if (!hasDatabase()) return {};
  try {
    const rows = await query<{ block_id: string; clicks: number }>(
      `SELECT block_id, clicks FROM link_clicks`
    );
    const out: Record<string, number> = {};
    for (const r of rows) out[r.block_id] = Number(r.clicks);
    return out;
  } catch {
    return {};
  }
}

/** Record one click on a block id (server-side, so it can't be spoofed). */
export async function incrementClick(blockId: string): Promise<void> {
  await query(
    `INSERT INTO link_clicks (block_id, clicks, updated_at)
     VALUES ($1, 1, now())
     ON CONFLICT (block_id) DO UPDATE SET clicks = link_clicks.clicks + 1, updated_at = now()`,
    [blockId]
  );
}

/**
 * Resolve a link block id to its destination URL for the /l/[id] redirect.
 * Returns null when the id is unknown or the URL is not a safe link shape.
 */
export async function resolveClickTarget(blockId: string): Promise<string | null> {
  const content = await getLinkInBio();
  const block = content.blocks.find((b) => b.id === blockId);
  if (!block || block.type !== "link") return null;
  const url = (block.url || "").trim();
  if (!url) return null;
  if (url.startsWith("/")) return url;
  try {
    const proto = new URL(url).protocol;
    if (["http:", "https:", "tel:", "mailto:"].includes(proto)) return url;
  } catch {
    return null;
  }
  return null;
}

/* ---------------------------- v1 migration ----------------------------- */

/** Build v2 blocks from the old fixed-shape content (best effort). */
function migrateFromV1(old: Record<string, unknown>): LinkInBioContentV2 {
  const str = (k: string, fallback = ""): string =>
    typeof old[k] === "string" ? (old[k] as string) : fallback;
  const bool = (k: string, fallback: boolean): boolean =>
    typeof old[k] === "boolean" ? (old[k] as boolean) : fallback;
  const rows = (k: string): { label: string; note: string; href: string }[] =>
    Array.isArray(old[k])
      ? (old[k] as unknown[]).map((r) => {
          const o = (r ?? {}) as Record<string, unknown>;
          return {
            label: typeof o.label === "string" ? o.label : "",
            note: typeof o.note === "string" ? o.note : "",
            href: typeof o.href === "string" ? o.href : "",
          };
        })
      : [];

  const d = linkInBioV2Defaults();
  const blocks: Block[] = [];

  if (str("siteLabel")) {
    blocks.push(
      newLinkFrom({
        title: str("siteLabel"),
        url: str("siteHref"),
        domain: str("siteHref") ? undefined : "",
        style: "plain",
      })
    );
  }
  blocks.push(
    newLinkFrom({ title: str("tourLabel", "Book a tour"), url: "/tour", style: "filled", pinned: "tour" })
  );
  if (str("callLabel")) {
    blocks.push(newLinkFrom({ title: str("callLabel"), url: str("callHref"), style: "filled" }));
  }
  if (str("dirLabel")) {
    blocks.push(newLinkFrom({ title: str("dirLabel"), url: str("dirHref"), style: "filled" }));
  }

  const trust = rows("trust");
  const community = rows("community");
  if (trust.length || community.length)
    blocks.push({ id: cryptoId(), type: "header", text: "Trust & community", active: true });
  for (const r of [...trust, ...community]) {
    if (!r.label && !r.href) continue;
    blocks.push(
      newLinkFrom({ title: r.label, url: r.href, subtitle: r.note, color: "green", style: "plain" })
    );
  }

  if (bool("showBlog", true)) {
    blocks.push({ id: cryptoId(), type: "blog", active: true, heading: str("blogHeading", "From the blog") });
  }
  // Keep a social block from defaults so the migrated page still has icons.
  const social = d.blocks.find((b) => b.type === "social");
  if (social) blocks.push(social);
  if (bool("showForm", true)) {
    blocks.push({
      id: cryptoId(),
      type: "form",
      active: true,
      heading: str("formHeading", "Have a question?"),
      blurb: str("formBlurb", d.profile.bio),
    });
  }

  const finalBlocks = blocks.length ? blocks : d.blocks;
  return {
    profile: {
      name: d.profile.name,
      bio: d.profile.bio,
      photoUrl: str("photoUrl"),
      photoCaption: str("photoCaption", d.profile.photoCaption),
    },
    // Deterministic ids so migrated-on-read content keeps stable ids across
    // requests (click counts + /l/<id> stay consistent until the editor saves).
    blocks: finalBlocks.map((b, i) => ({ ...b, id: `v1-${i}` })),
  };
}

function cryptoId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `b${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
