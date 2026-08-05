import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Image storage for blog images. Uses any S3-compatible bucket; Cloudflare R2
 * is the natural fit here (Cloudflare is already in front of the site).
 *
 * OPTIONAL: if these env vars are not set, uploads are disabled and the editor
 * still works by pasting an image URL instead. Set all of these to enable
 * uploads:
 *   S3_ENDPOINT          e.g. https://<accountid>.r2.cloudflarestorage.com
 *   S3_REGION            e.g. auto (R2) or us-east-1 (AWS)
 *   S3_ACCESS_KEY_ID
 *   S3_SECRET_ACCESS_KEY
 *   S3_BUCKET            bucket name
 *   S3_PUBLIC_URL        public base URL for the bucket (e.g. an R2 public /
 *                        custom domain), used to build the returned image URL
 */

function config() {
  const {
    S3_ENDPOINT,
    S3_REGION,
    S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY,
    S3_BUCKET,
    S3_PUBLIC_URL,
  } = process.env;
  if (
    !S3_ACCESS_KEY_ID ||
    !S3_SECRET_ACCESS_KEY ||
    !S3_BUCKET ||
    !S3_PUBLIC_URL
  ) {
    return null;
  }
  return {
    endpoint: S3_ENDPOINT,
    region: S3_REGION || "auto",
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    bucket: S3_BUCKET,
    publicUrl: S3_PUBLIC_URL.replace(/\/$/, ""),
  };
}

export function storageEnabled(): boolean {
  return config() !== null;
}

/**
 * Check that a just-uploaded object is actually readable at its public URL.
 * The #1 cause of "I uploaded a photo but it shows the placeholder" is an
 * S3_PUBLIC_URL that points at the private S3 API endpoint (which needs signed
 * requests) instead of the bucket's public URL (R2.dev subdomain or a custom
 * domain), or a bucket without public access. A quick GET catches that and lets
 * the UI say so, instead of the image silently 403ing on the live site.
 */
export async function verifyPublicUrl(
  url: string
): Promise<{ ok: boolean; status: number | null }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: null };
  }
}

/**
 * Build an operator-facing message for an upload whose public URL did not load.
 * Includes the exact URL (admin-only). The fix is always the same: make
 * S3_PUBLIC_URL equal everything before "/blog/" in the object's real public
 * URL. Whether that includes the bucket name depends on the bucket's public-URL
 * style (some R2 dev URLs include it, some do not), so we tell the operator to
 * copy it from the bucket rather than guessing.
 */
export function publicUrlProblem(url: string, status: number | null): string {
  const code = status ? `HTTP ${status}` : "no response";
  const meaning =
    status === 404
      ? "the file is not at that URL, so S3_PUBLIC_URL does not match the bucket's real public URL"
      : status === 401 || status === 403
        ? "access is denied. The bucket may not be public, or S3_PUBLIC_URL is the private S3 endpoint (…r2.cloudflarestorage.com) instead of the public URL"
        : "the URL could not be loaded";

  return `Uploaded, but the image did not load from ${url} (${code}): ${meaning}. Open the file in your bucket, copy its public URL, and set S3_PUBLIC_URL to everything BEFORE "/blog/". See OPERATIONS.md.`;
}

export async function uploadImage(
  bytes: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const cfg = config();
  if (!cfg) {
    throw new Error("Image storage is not configured (see S3_* env vars).");
  }

  const client = new S3Client({
    endpoint: cfg.endpoint,
    region: cfg.region,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: bytes,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return resolvePublicUrl(cfg.publicUrl, cfg.bucket, key);
}

/**
 * Return the public URL that actually loads for a just-uploaded object.
 *
 * Some R2 public URLs serve objects at `{base}/{key}`, others at
 * `{base}/{bucket}/{key}`. Rather than depend on S3_PUBLIC_URL being set with
 * exactly the right shape (a recurring foot-gun), we try both and store the one
 * that returns 200, so uploads render either way. Falls back to the plain
 * `{base}/{key}` if neither loads (the upload route then warns with the URL).
 */
async function resolvePublicUrl(
  base: string,
  bucket: string,
  key: string
): Promise<string> {
  const primary = `${base}/${key}`;

  // If the base already ends with the bucket name, the bucket is in the path
  // and there is only one sensible URL to try.
  let alreadyHasBucket = false;
  try {
    const segments = new URL(base).pathname.split("/").filter(Boolean);
    alreadyHasBucket = segments[segments.length - 1] === bucket;
  } catch {
    // base is not a valid URL; just use the primary form
    return primary;
  }

  const candidates = alreadyHasBucket
    ? [primary]
    : [primary, `${base}/${bucket}/${key}`];

  for (const url of candidates) {
    const { ok } = await verifyPublicUrl(url);
    if (ok) return url;
  }
  return primary;
}
