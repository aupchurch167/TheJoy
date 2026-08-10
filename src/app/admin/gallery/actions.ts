"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import {
  addPhoto,
  deletePhoto,
  updatePhotoImage,
  updatePhotoMeta,
  getPhotos,
} from "@/lib/photos";
import { aiEnabled, describePhoto, type PhotoMeta } from "@/lib/ai";

const AddSchema = z.object({
  imageUrl: z.string().trim().url("A valid image URL is required.").max(1000),
  caption: z.string().trim().max(500).optional(),
  alt: z.string().trim().max(300).optional(),
});

const UpdateImageSchema = z.object({
  id: z.string().trim().min(1),
  imageUrl: z.string().trim().url("A valid image URL is required.").max(1000),
});

export type PhotoResult = { ok: true } | { ok: false; error: string };

export async function addPhotoAction(input: unknown): Promise<PhotoResult> {
  await requireAdmin();
  const parsed = AddSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  }
  try {
    await addPhoto(
      parsed.data.imageUrl,
      parsed.data.caption || null,
      parsed.data.alt || null
    );
    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return { ok: true };
  } catch (err) {
    console.error("[addPhotoAction]", err);
    return { ok: false, error: "Could not add. Is the database connected?" };
  }
}

export async function updatePhotoImageAction(
  input: unknown
): Promise<PhotoResult> {
  await requireAdmin();
  const parsed = UpdateImageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  }
  try {
    await updatePhotoImage(parsed.data.id, parsed.data.imageUrl);
    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return { ok: true };
  } catch (err) {
    console.error("[updatePhotoImageAction]", err);
    return { ok: false, error: "Could not update. Is the database connected?" };
  }
}

const DescribeSchema = z.object({
  imageUrl: z.string().trim().url("A valid image URL is required.").max(1000),
});

export type DescribeResult =
  | { ok: true; meta: PhotoMeta }
  | { ok: false; error: string };

/**
 * Ask the AI for SEO-friendly alt text + caption for an image (used by the
 * add form). Returns the suggestion for the operator to review before saving.
 */
export async function suggestPhotoMetaAction(
  input: unknown
): Promise<DescribeResult> {
  await requireAdmin();
  if (!aiEnabled()) {
    return {
      ok: false,
      error: "AI is not set up yet. Add ANTHROPIC_API_KEY (see OPERATIONS.md).",
    };
  }
  const parsed = DescribeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  }
  try {
    const meta = await describePhoto(parsed.data.imageUrl);
    return { ok: true, meta };
  } catch (err) {
    console.error("[suggestPhotoMetaAction]", err);
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "The AI could not read that image.",
    };
  }
}

/**
 * Generate alt text + caption for an existing gallery photo and save them.
 * Returns the caption so the UI can confirm what was written.
 */
export async function generatePhotoMetaAction(
  id: string
): Promise<{ ok: true; meta: PhotoMeta } | { ok: false; error: string }> {
  await requireAdmin();
  if (!aiEnabled()) {
    return {
      ok: false,
      error: "AI is not set up yet. Add ANTHROPIC_API_KEY (see OPERATIONS.md).",
    };
  }
  const photo = (await getPhotos()).find((p) => p.id === id);
  if (!photo) return { ok: false, error: "Photo not found." };
  try {
    const meta = await describePhoto(photo.image_url);
    await updatePhotoMeta(id, meta.caption || null, meta.alt || null);
    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return { ok: true, meta };
  } catch (err) {
    console.error("[generatePhotoMetaAction]", err);
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "The AI could not read that image.",
    };
  }
}

export async function removePhotoAction(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await deletePhoto(id);
    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return { ok: true };
  } catch (err) {
    console.error("[removePhotoAction]", err);
    return { ok: false };
  }
}
