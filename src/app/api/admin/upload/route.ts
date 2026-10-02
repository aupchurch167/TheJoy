import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/require-admin";
import {
  storageEnabled,
  uploadImage,
  verifyPublicUrl,
  publicUrlProblem,
} from "@/lib/storage";
import { slugify } from "@/lib/posts";
import { compressForWeb } from "@/lib/compress-image";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 401 });
  }
  if (!storageEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Image uploads are not set up yet. Paste an image URL instead, or ask to configure storage (S3_* env vars).",
      },
      { status: 503 }
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { ok: false, error: "Use a JPG, PNG, WebP, or GIF image." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "That image is over 8 MB. Please use a smaller one." },
      { status: 400 }
    );
  }

  try {
    const raw = Buffer.from(await file.arrayBuffer());
    const prepared = await compressForWeb(raw, file.type);
    const ext =
      prepared.contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
    // Suffix is the stored byte length so two uploads of the same name still
    // land on different keys.
    const key = `blog/${base}-${prepared.bytes.length}.${ext}`;
    const url = await uploadImage(prepared.bytes, key, prepared.contentType);

    // The upload can succeed to the bucket yet not be publicly readable (wrong
    // S3_PUBLIC_URL, or the bucket is not public). Catch that here so the admin
    // gets a clear message instead of a silent placeholder on the site.
    const check = await verifyPublicUrl(url);
    if (!check.ok) {
      return NextResponse.json({
        ok: true,
        url,
        warning: publicUrlProblem(url, check.status),
      });
    }

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json(
      { ok: false, error: "Upload failed. Try again or paste a URL." },
      { status: 500 }
    );
  }
}
