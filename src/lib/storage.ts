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
 * Includes the exact URL (admin-only) and a targeted hint for the two common
 * causes: a 404 from S3_PUBLIC_URL carrying an extra bucket-name path segment
 * (or mapping to a different bucket), and a 401/403 from public access being
 * off or S3_PUBLIC_URL being the private S3 endpoint.
 */
export function publicUrlProblem(url: string, status: number | null): string {
  const cfg = config();
  const bucket = cfg?.bucket;

  let hint = "";
  try {
    const path = new URL(url).pathname;
    if (bucket && (path === `/${bucket}` || path.startsWith(`/${bucket}/`))) {
      hint = ` It looks like S3_PUBLIC_URL includes the bucket name ("${bucket}"). The public R2/S3 URL already points at the bucket, so remove "/${bucket}" from S3_PUBLIC_URL.`;
    }
  } catch {
    // ignore URL parse issues
  }

  const code = status ? `HTTP ${status}` : "no response";
  const meaning =
    status === 404
      ? "the file is not at that URL. Usually S3_PUBLIC_URL points to the wrong bucket, or has an extra path segment"
      : status === 401 || status === 403
        ? "access is denied. The bucket may not be public, or S3_PUBLIC_URL is the private S3 endpoint (…r2.cloudflarestorage.com) instead of the public URL"
        : "the URL could not be loaded";

  return `Uploaded, but the image did not load from ${url} (${code}): ${meaning}.${hint} See OPERATIONS.md.`;
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

  return `${cfg.publicUrl}/${key}`;
}
