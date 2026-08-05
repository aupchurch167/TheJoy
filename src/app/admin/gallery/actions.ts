"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { addPhoto, deletePhoto, updatePhotoImage } from "@/lib/photos";

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
