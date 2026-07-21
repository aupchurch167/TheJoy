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
