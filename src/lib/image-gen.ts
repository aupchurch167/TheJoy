/**
 * Hero-image generation via Google's Gemini API (Imagen text-to-image). Used by
 * the blog editor to create an illustrative hero image from a prompt. These are
 * AI illustrations, not real photos of Joy (which stay under the "real photos
 * only" rule); the editor labels them as such.
 *
 * Env:
 *   GEMINI_API_KEY       required to enable generation (from aistudio.google.com)
 *   GEMINI_IMAGE_MODEL   optional model override. Default is a current Imagen
 *                        model; set this if your account exposes a different id
 *                        (e.g. imagen-3.0-generate-002).
 */

const MODEL = process.env.GEMINI_IMAGE_MODEL || "imagen-4.0-generate-001";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export function imageGenEnabled(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export type GeneratedImage = { bytes: Buffer; mimeType: string };

/** Generate one 16:9 hero image from a prompt. Throws with a clear message. */
export async function generateHeroImage(prompt: string): Promise<GeneratedImage> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Image generation is not configured (set GEMINI_API_KEY).");
  }

  // Bake in the house aesthetic and hard "no text/branding" constraints so the
  // result reads as an editorial illustration, never a fake photo of Joy.
  const styledPrompt = `${prompt.trim()}

Warm natural light, documentary editorial photography, soft focus, calm and hopeful. Absolutely no text, words, captions, logos, watermarks, or signage anywhere in the image.`;

  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}/${MODEL}:predict?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: styledPrompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "16:9",
          personGeneration: "allow_adult",
        },
      }),
    });
  } catch (err) {
    console.error("[image-gen] fetch failed", err);
    throw new Error("Could not reach the image service. Please try again.");
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error?.message || "";
    } catch {
      // ignore parse errors
    }
    // Common case: a wrong/unavailable model id. Surface enough to fix it.
    throw new Error(
      `Image generation failed (${res.status})${detail ? `: ${detail.slice(0, 300)}` : "."}`
    );
  }

  const data = await res.json();
  const prediction = data?.predictions?.[0];
  const b64: string | undefined = prediction?.bytesBase64Encoded;
  if (!b64) {
    // Imagen returns no image when a prompt is blocked by safety filters.
    throw new Error(
      "No image came back (the prompt may have been blocked). Try rewording it."
    );
  }

  return {
    bytes: Buffer.from(b64, "base64"),
    mimeType: prediction?.mimeType || "image/png",
  };
}
