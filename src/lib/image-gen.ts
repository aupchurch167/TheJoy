/**
 * Hero-image generation via Google's Gemini API. Used by the blog editor to
 * create an illustrative hero image from a prompt. These are AI illustrations,
 * not real photos of Joy (which stay under the "real photos only" rule); the
 * editor labels them as such.
 *
 * Supports both of Google's image APIs, chosen by the model name:
 *   - "gemini-*"  -> generateContent (inline image data). This is the default.
 *   - "imagen-*"  -> predict (Imagen), with a 16:9 aspect-ratio parameter.
 *
 * Env:
 *   GEMINI_API_KEY       required to enable generation (from aistudio.google.com)
 *   GEMINI_IMAGE_MODEL   optional model override. Default: gemini-2.5-flash-image.
 *                        Set this if your account exposes a different id, e.g.
 *                        "imagen-3.0-generate-002" or "gemini-2.0-flash-preview-image-generation".
 */

const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export function imageGenEnabled(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export type GeneratedImage = { bytes: Buffer; mimeType: string };

/** Generate one hero image from a prompt. Throws with a clear message. */
export async function generateHeroImage(prompt: string): Promise<GeneratedImage> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Image generation is not configured (set GEMINI_API_KEY).");
  }

  // Bake in the house aesthetic and hard "no text/branding" constraints so the
  // result reads as an editorial illustration, never a fake photo of Joy.
  const styledPrompt = `${prompt.trim()}

Warm natural light, documentary editorial photography, soft focus, calm and hopeful, wide 16:9 landscape composition. Absolutely no text, words, captions, logos, watermarks, or signage anywhere in the image.`;

  return MODEL.startsWith("imagen")
    ? generateWithImagen(key, styledPrompt)
    : generateWithGemini(key, styledPrompt);
}

/** Read an upstream Google API error message (best effort). */
async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message || "";
  } catch {
    return "";
  }
}

async function post(url: string, payload: unknown): Promise<Response> {
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[image-gen] fetch failed", err);
    throw new Error("Could not reach the image service. Please try again.");
  }
}

/** Gemini image models (e.g. gemini-2.5-flash-image) via generateContent. */
async function generateWithGemini(
  key: string,
  prompt: string
): Promise<GeneratedImage> {
  const res = await post(`${ENDPOINT}/${MODEL}:generateContent?key=${key}`, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  });

  if (!res.ok) {
    const detail = await readError(res);
    throw new Error(
      `Image generation failed (${res.status})${detail ? `: ${detail.slice(0, 300)}` : "."}`
    );
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = part?.inlineData ?? part?.inline_data;
    if (inline?.data) {
      return {
        bytes: Buffer.from(inline.data, "base64"),
        mimeType: inline.mimeType ?? inline.mime_type ?? "image/png",
      };
    }
  }
  throw new Error(
    "No image came back (the prompt may have been blocked). Try rewording it."
  );
}

/** Imagen models (e.g. imagen-3.0-generate-002) via predict. */
async function generateWithImagen(
  key: string,
  prompt: string
): Promise<GeneratedImage> {
  const res = await post(`${ENDPOINT}/${MODEL}:predict?key=${key}`, {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: "16:9",
      personGeneration: "allow_adult",
    },
  });

  if (!res.ok) {
    const detail = await readError(res);
    throw new Error(
      `Image generation failed (${res.status})${detail ? `: ${detail.slice(0, 300)}` : "."}`
    );
  }

  const data = await res.json();
  const prediction = data?.predictions?.[0];
  const b64: string | undefined = prediction?.bytesBase64Encoded;
  if (!b64) {
    throw new Error(
      "No image came back (the prompt may have been blocked). Try rewording it."
    );
  }
  return {
    bytes: Buffer.from(b64, "base64"),
    mimeType: prediction?.mimeType || "image/png",
  };
}
