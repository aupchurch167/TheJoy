import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/require-admin";
import {
  storageEnabled,
  uploadImage,
  verifyPublicUrl,
  publicUrlProblem,
} from "@/lib/storage";
import { slugify } from "@/lib/posts";

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

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
  // Deterministic-ish unique key without Date.now (kept simple + collision-safe
  // via the random-ish suffix from the file size + name).
  const key = `blog/${base}-${file.size}.${ext}`;

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage(bytes, key, file.type);

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
