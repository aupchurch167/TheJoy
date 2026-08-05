/**
 * One-time repair for image URLs that were saved without the bucket segment.
 *
 * Some R2 public URLs serve objects at {host}/{bucket}/{key} rather than
 * {host}/{key}. Images uploaded while S3_PUBLIC_URL was missing the bucket got
 * their public link saved as {host}/blog/<file> (a 404). This script finds
 * those saved links (blog hero images, inline post images, and site photos),
 * inserts the bucket into the path, VERIFIES the corrected URL actually loads,
 * and only then rewrites it in the database. Already-correct and non-R2 URLs
 * (e.g. Webflow CDN images) are left untouched.
 *
 * Safe to run more than once (idempotent). Always preview first with --dry.
 *
 * Usage (with DATABASE_URL, S3_PUBLIC_URL, S3_BUCKET in the environment):
 *   node scripts/fix-image-urls.mjs --dry     # preview, changes nothing
 *   node scripts/fix-image-urls.mjs           # apply
 *
 * On Railway:
 *   railway run node scripts/fix-image-urls.mjs --dry
 *   railway run node scripts/fix-image-urls.mjs
 */

import { Pool } from "pg";

const DRY = process.argv.includes("--dry");

function env(name) {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
}

const DATABASE_URL = env("DATABASE_URL");
const S3_PUBLIC_URL = env("S3_PUBLIC_URL");
const S3_BUCKET = env("S3_BUCKET");

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}
if (!S3_PUBLIC_URL || !S3_BUCKET) {
  console.error("S3_PUBLIC_URL and S3_BUCKET are required.");
  process.exit(1);
}

let ORIGIN;
try {
  ORIGIN = new URL(S3_PUBLIC_URL).origin; // e.g. https://pub-....r2.dev
} catch {
  console.error(`S3_PUBLIC_URL is not a valid URL: ${S3_PUBLIC_URL}`);
  process.exit(1);
}
const BUCKET = S3_BUCKET.replace(/^\/+|\/+$/g, "");

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
// Match any URL on our R2 host, stopping at whitespace or common delimiters.
const URL_RE = new RegExp(escapeRe(ORIGIN) + "/[^\\s)\"'<>\\]]+", "g");

/** Corrected URL (bucket inserted) or null when no fix is needed / not ours. */
function fixUrl(u) {
  let parsed;
  try {
    parsed = new URL(u);
  } catch {
    return null;
  }
  if (parsed.origin !== ORIGIN) return null; // not our bucket host
  if (parsed.pathname === `/${BUCKET}` || parsed.pathname.startsWith(`/${BUCKET}/`)) {
    return null; // already has the bucket in the path
  }
  return `${ORIGIN}/${BUCKET}${parsed.pathname}${parsed.search}${parsed.hash}`;
}

async function loads(u) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(u, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

const sslDisabled =
  process.env.PGSSL === "false" || /\bsslmode=disable\b/.test(DATABASE_URL);
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: sslDisabled ? undefined : { rejectUnauthorized: false },
  max: 3,
});

function collect(text, set) {
  if (!text) return;
  for (const m of String(text).matchAll(URL_RE)) set.add(m[0]);
}

async function main() {
  console.log(
    `${DRY ? "[DRY RUN] " : ""}Repairing R2 image URLs on ${ORIGIN} (bucket "${BUCKET}").\n`
  );

  const posts = (
    await pool.query("SELECT id, title, hero_image, body FROM posts")
  ).rows;
  const settings = (
    await pool.query("SELECT key, value FROM site_settings WHERE key LIKE 'photo_%'")
  ).rows;

  // Gather every distinct R2 URL currently stored.
  const found = new Set();
  for (const p of posts) {
    collect(p.hero_image, found);
    collect(p.body, found);
  }
  for (const s of settings) collect(s.value, found);

  // Build the verified old -> new map.
  const fixMap = new Map();
  const unreachable = [];
  for (const old of found) {
    const fixed = fixUrl(old);
    if (!fixed) continue; // already correct or not ours
    if (await loads(fixed)) fixMap.set(old, fixed);
    else unreachable.push({ old, fixed });
  }

  console.log(
    `Found ${found.size} R2 URLs. ${fixMap.size} need fixing and load at the corrected URL. ${unreachable.length} could not be verified.\n`
  );
  for (const [old, next] of fixMap) console.log(`  fix: ${old}\n    -> ${next}`);
  if (unreachable.length) {
    console.log("\nCould NOT verify (left unchanged):");
    for (const u of unreachable) console.log(`  ${u.old}\n    tried ${u.fixed}`);
  }

  if (fixMap.size === 0) {
    console.log("\nNothing to change.");
    await pool.end();
    return;
  }

  let posts_changed = 0;
  let settings_changed = 0;

  for (const p of posts) {
    let hero = p.hero_image;
    let body = p.body;
    let touched = false;
    if (hero && fixMap.has(hero)) {
      hero = fixMap.get(hero);
      touched = true;
    }
    if (body) {
      for (const [old, next] of fixMap) {
        if (body.includes(old)) {
          body = body.split(old).join(next);
          touched = true;
        }
      }
    }
    if (touched) {
      posts_changed++;
      if (!DRY) {
        await pool.query(
          "UPDATE posts SET hero_image = $1, body = $2, updated_at = now() WHERE id = $3",
          [hero, body, p.id]
        );
      }
      console.log(`${DRY ? "[dry] " : ""}post updated: ${p.title || p.id}`);
    }
  }

  for (const s of settings) {
    if (fixMap.has(s.value)) {
      settings_changed++;
      if (!DRY) {
        await pool.query(
          "UPDATE site_settings SET value = $1, updated_at = now() WHERE key = $2",
          [fixMap.get(s.value), s.key]
        );
      }
      console.log(`${DRY ? "[dry] " : ""}site photo updated: ${s.key}`);
    }
  }

  console.log(
    `\n${DRY ? "[DRY RUN] would update" : "Updated"} ${posts_changed} post(s) and ${settings_changed} site photo(s).`
  );
  if (DRY) console.log("Re-run without --dry to apply.");

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
