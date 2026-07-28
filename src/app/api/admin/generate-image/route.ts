import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/require-admin";
import { imageGenEnabled, generateHeroImage } from "@/lib/image-gen";
import { storageEnabled, uploadImage } from "@/lib/storage";
import { slugify } from "@/lib/posts";

export const runtime = "nodejs";
export const maxDuration = 120; // image generation can take a while

const Schema = z.object({
  prompt: z.string().trim().min(3, "Write a prompt for the image.").max(2000),
  // Optional post slug/title, only used to name the stored file.
  slug: z.string().trim().max(200).optional(),
});

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 401 });
  }
  if (!imageGenEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Image generation is not set up yet. Add GEMINI_API_KEY to enable it (see OPERATIONS.md).",
      },
      { status: 503 }
    );
  }
  if (!storageEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Generated images need storage to save (S3 / Cloudflare R2). Set the S3_* env vars, or paste an image URL instead.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." },
      { status: 400 }
    );
  }

  try {
    const { bytes, mimeType } = await generateHeroImage(parsed.data.prompt);
    const ext = (mimeType.split("/")[1] || "png").replace("jpeg", "jpg");
    const base = slugify(parsed.data.slug || "hero") || "hero";
    // Collision-safe key without Date.now (kept out of this runtime).
    const key = `blog/ai/${base}-${bytes.length}.${ext}`;
    const url = await uploadImage(bytes, key, mimeType);
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("[generate-image]", err);
    const message =
      err instanceof Error ? err.message : "Image generation failed. Please try again.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
