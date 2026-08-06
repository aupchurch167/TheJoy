/**
 * Move legacy blog images off the Webflow CDN and into our own R2 bucket.
 *
 * Migrated posts still hotlink images from the old Webflow CDN
 * (uploads-ssl.webflow.com / *.website-files.com). The day the Webflow
 * subscription is cancelled, every one of those images (and its Article-schema
 * image) breaks. This script downloads each Webflow image, uploads it to R2,
 * VERIFIES the new public URL actually loads, and only THEN rewrites the URL in
 * the post's hero_image and body. Anything it cannot download or verify is left
 * exactly as-is and reported, so a misconfigured bucket can never corrupt the
 * database. It is idempotent (already-migrated URLs are skipped) and safe to
 * re-run.
 *
 * Required env (same vars the app uses):
 *   DATABASE_URL
 *   S3_ENDPOINT           e.g. https://<accountid>.r2.cloudflarestorage.com
 *                         (NOTE: must NOT include the bucket name)
 *   S3_REGION             usually "auto" for R2
 *   S3_ACCESS_KEY_ID
 *   S3_SECRET_ACCESS_KEY
 *   S3_BUCKET             e.g. the-joy
 *   S3_PUBLIC_URL         the bucket's PUBLIC base URL (r2.dev or custom domain)
 *
 * Usage:
 *   node scripts/migrate-blog-images.mjs --dry     # preview, changes nothing
 *   node scripts/migrate-blog-images.mjs           # download, upload, rewrite
 *
 * On Railway (runs with the service's env):
 *   railway run node scripts/migrate-blog-images.mjs --dry
 *   railway run node scripts/migrate-blog-images.mjs
 */

import { Pool } from "pg";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";

const DRY = process.argv.includes("--dry");

function env(name) {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
}

const DATABASE_URL = env("DATABASE_URL");
const S3_ENDPOINT = env("S3_ENDPOINT");
const S3_REGION = env("S3_REGION") || "auto";
const S3_ACCESS_KEY_ID = env("S3_ACCESS_KEY_ID");
const S3_SECRET_ACCESS_KEY = env("S3_SECRET_ACCESS_KEY");
const S3_BUCKET = env("S3_BUCKET");
const S3_PUBLIC_URL = env("S3_PUBLIC_URL");

const missing = [];
if (!DATABASE_URL) missing.push("DATABASE_URL");
if (!S3_ACCESS_KEY_ID) missing.push("S3_ACCESS_KEY_ID");
if (!S3_SECRET_ACCESS_KEY) missing.push("S3_SECRET_ACCESS_KEY");
if (!S3_BUCKET) missing.push("S3_BUCKET");
if (!S3_PUBLIC_URL) missing.push("S3_PUBLIC_URL");
if (missing.length) {
  console.error(`Missing required env: ${missing.join(", ")}`);
  process.exit(1);
}

const PUBLIC_BASE = S3_PUBLIC_URL.replace(/\/$/, "");
const BUCKET = S3_BUCKET.replace(/^\/+|\/+$/g, "");

// Any image URL on a Webflow host, up to whitespace / markdown / html delimiters.
const WEBFLOW_RE =
  /https?:\/\/(?:uploads-ssl\.webflow\.com|[a-z0-9.-]*\.website-files\.com)\/[^\s)"'<>\]]+/gi;

const CONTENT_TYPE_BY_EXT = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
};

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
});

const sslDisabled =
  process.env.PGSSL === "false" || /\bsslmode=disable\b/.test(DATABASE_URL);
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: sslDisabled ? undefined : { rejectUnauthorized: false },
  max: 3,
});

function collect(text, set) {
  if (!text) return;
  for (const m of String(text).matchAll(WEBFLOW_RE)) set.add(m[0]);
}

function keyFor(url) {
  const { pathname } = new URL(url);
  const base = pathname.split("/").filter(Boolean).pop() || "image";
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^-+/, "");
  // Prefix a short hash of the full URL so two images that happen to share a
  // filename never collide in the bucket.
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 8);
  return `blog/${hash}-${safe}`;
}

function contentTypeFor(url, headerType) {
  if (headerType && headerType.startsWith("image/")) return headerType;
  const ext = (new URL(url).pathname.split(".").pop() || "").toLowerCase();
  return CONTENT_TYPE_BY_EXT[ext] || "application/octet-stream";
}

async function download(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!res.ok) return { ok: false, status: res.status };
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      ok: true,
      bytes: buf,
      contentType: contentTypeFor(url, res.headers.get("content-type") || ""),
    };
  } catch {
    return { ok: false, status: null };
  } finally {
    clearTimeout(timer);
  }
}

async function loads(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

// Try {base}/{key} first, then {base}/{bucket}/{key} (R2 public URLs differ),
// returning whichever actually loads. Null if neither does.
async function publicUrlThatLoads(key) {
  let alreadyHasBucket = false;
  try {
    const segs = new URL(PUBLIC_BASE).pathname.split("/").filter(Boolean);
    alreadyHasBucket = segs[segs.length - 1] === BUCKET;
  } catch {
    // not a URL; fall through
  }
  const candidates = alreadyHasBucket
    ? [`${PUBLIC_BASE}/${key}`]
    : [`${PUBLIC_BASE}/${key}`, `${PUBLIC_BASE}/${BUCKET}/${key}`];
  for (const url of candidates) {
    if (await loads(url)) return url;
  }
  return null;
}

async function main() {
  console.log(
    `${DRY ? "[DRY RUN] " : ""}Migrating Webflow blog images to R2 (bucket "${BUCKET}", public ${PUBLIC_BASE}).\n`
  );

  const posts = (
    await pool.query("SELECT id, title, hero_image, body FROM posts")
  ).rows;

  const found = new Set();
  for (const p of posts) {
    collect(p.hero_image, found);
    collect(p.body, found);
  }

  if (found.size === 0) {
    console.log("No Webflow image URLs found. Nothing to do.");
    await pool.end();
    return;
  }
  console.log(`Found ${found.size} distinct Webflow image URL(s).\n`);

  // old Webflow URL -> new R2 URL (only for images that uploaded AND verified).
  const map = new Map();
  const failures = [];
  for (const url of found) {
    const key = keyFor(url);
    const dl = await download(url);
    if (!dl.ok) {
      failures.push({ url, reason: `download failed (${dl.status ?? "no response"})` });
      continue;
    }
    if (DRY) {
      console.log(`[dry] would upload ${url}\n        -> ${PUBLIC_BASE}/${key} (${dl.bytes.length} bytes)`);
      map.set(url, `${PUBLIC_BASE}/${key}`);
      continue;
    }
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: dl.bytes,
          ContentType: dl.contentType,
          CacheControl: "public, max-age=31536000, immutable",
        })
      );
    } catch (e) {
      failures.push({ url, reason: `R2 upload error: ${e?.message || e}` });
      continue;
    }
    const publicUrl = await publicUrlThatLoads(key);
    if (!publicUrl) {
      failures.push({
        url,
        reason: `uploaded, but the new public URL did not load (check S3_PUBLIC_URL / bucket public access)`,
      });
      continue;
    }
    map.set(url, publicUrl);
    console.log(`ok: ${url}\n     -> ${publicUrl}`);
  }

  console.log(
    `\n${map.size} image(s) ${DRY ? "would migrate" : "migrated & verified"}, ${failures.length} could not be migrated.`
  );
  if (failures.length) {
    console.log("\nLeft unchanged (fix and re-run):");
    for (const f of failures) console.log(`  ${f.url}\n    ${f.reason}`);
  }

  if (map.size === 0) {
    await pool.end();
    return;
  }

  // Rewrite each post's hero_image + body using the verified map.
  let changed = 0;
  for (const p of posts) {
    let hero = p.hero_image;
    let body = p.body;
    let touched = false;
    if (hero && map.has(hero)) {
      hero = map.get(hero);
      touched = true;
    }
    if (body) {
      for (const [oldUrl, newUrl] of map) {
        if (body.includes(oldUrl)) {
          body = body.split(oldUrl).join(newUrl);
          touched = true;
        }
      }
    }
    if (touched) {
      changed++;
      if (!DRY) {
        await pool.query(
          "UPDATE posts SET hero_image = $1, body = $2, updated_at = now() WHERE id = $3",
          [hero, body, p.id]
        );
      }
      console.log(`${DRY ? "[dry] " : ""}post updated: ${p.title || p.id}`);
    }
  }

  console.log(
    `\n${DRY ? "[DRY RUN] would update" : "Updated"} ${changed} post(s).`
  );
  if (DRY) console.log("Re-run without --dry to apply.");
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await pool.end();
  } catch {
    // ignore
  }
  process.exit(1);
});
