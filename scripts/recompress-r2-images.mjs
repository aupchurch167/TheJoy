/**
 * Re-encode oversized images already stored in the R2 bucket.
 *
 * The site serves most photos through next/image, but the originals are what
 * the optimizer downloads, what Open Graph tags point at, and what any raw
 * <img> still fetches. This script downloads each large image, runs the same
 * compressForWeb pass new uploads use, and (only with --apply) writes it back
 * to the SAME key so public URLs do not change.
 *
 * A large opaque PNG may come back as JPEG bytes. The key stays the same
 * (it may still end in .png). Content-Type is updated. Browsers and next/image
 * honor Content-Type. Nothing is written unless the new file is at least 20%
 * smaller.
 *
 * Webflow CDN files (cdn.prod.website-files.com, uploads-ssl.webflow.com) are
 * not in this bucket and are not touched.
 *
 * Required env (same vars the app uses):
 *   S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY,
 *   S3_BUCKET, S3_PUBLIC_URL
 *
 * Usage:
 *   node --experimental-strip-types scripts/recompress-r2-images.mjs
 *   node --experimental-strip-types scripts/recompress-r2-images.mjs --apply
 *
 * On Railway, with the service env loaded:
 *   railway run node --experimental-strip-types scripts/recompress-r2-images.mjs
 *   railway run node --experimental-strip-types scripts/recompress-r2-images.mjs --apply
 *
 * Default is a dry run. It downloads and reports. It does not upload.
 */

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { compressForWeb } from "../src/lib/compress-image.ts";

const APPLY = process.argv.includes("--apply");
const MIN_BYTES = 400 * 1024;

function env(name) {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
}

const missing = [
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_BUCKET",
  "S3_PUBLIC_URL",
].filter((name) => !env(name));

if (missing.length) {
  console.error(`Missing required env: ${missing.join(", ")}`);
  console.error(
    "These are set on the TheJoy Railway service but are not readable from a connected agent. Run this on a machine that has the S3_* variables (railway run, or the Railway shell)."
  );
  process.exit(1);
}

const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;

const client = new S3Client({
  endpoint: env("S3_ENDPOINT") || undefined,
  region: env("S3_REGION") || "auto",
  credentials: {
    accessKeyId: env("S3_ACCESS_KEY_ID"),
    secretAccessKey: env("S3_SECRET_ACCESS_KEY"),
  },
});

const bucket = env("S3_BUCKET");

async function listAll() {
  const objects = [];
  let token;
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: token,
      })
    );
    for (const item of page.Contents || []) {
      if (item.Key) objects.push(item);
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return objects;
}

function fmt(n) {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MiB`;
  return `${Math.round(n / 1024)} KiB`;
}

const objects = await listAll();
const targets = objects
  .filter((item) => IMAGE_EXT.test(item.Key) && (item.Size || 0) >= MIN_BYTES)
  .sort((a, b) => (b.Size || 0) - (a.Size || 0));

console.log(
  `${APPLY ? "APPLY" : "DRY RUN"}  bucket=${bucket}  objects=${objects.length}  at or over ${fmt(MIN_BYTES)}: ${targets.length}`
);

let saved = 0;
let rewritten = 0;

for (const item of targets) {
  const key = item.Key;
  const before = item.Size || 0;
  try {
    const got = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    const bytes = Buffer.from(await got.Body.transformToByteArray());
    const type = got.ContentType || "application/octet-stream";
    const prepared = await compressForWeb(bytes, type);
    const after = prepared.bytes.length;
    const worthIt = after <= before * 0.8;
    const action = worthIt ? (APPLY ? "rewrite" : "would rewrite") : "keep";
    console.log(
      `${action.padEnd(14)} ${fmt(before).padStart(10)} -> ${fmt(after).padStart(10)}  ${type} -> ${prepared.contentType}  ${key}`
    );
    if (!worthIt) continue;
    saved += before - after;
    if (!APPLY) continue;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: prepared.bytes,
        ContentType: prepared.contentType,
        CacheControl:
          got.CacheControl || "public, max-age=31536000, immutable",
      })
    );
    rewritten += 1;
  } catch (err) {
    console.error(`failed ${key}: ${err instanceof Error ? err.message : err}`);
  }
}

console.log(
  APPLY
    ? `Rewrote ${rewritten} object(s). About ${fmt(saved)} smaller on the origin.`
    : `Dry run only. About ${fmt(saved)} could be saved. Re-run with --apply to write the same keys.`
);
