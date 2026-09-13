"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import {
  deleteReview,
  setReviewFeatured,
  setReviewStatus,
  upsertReviewSource,
} from "@/lib/reviews";

export type ReviewActionResult = { ok: true } | { ok: false; error: string };

const idSchema = z.string().uuid();

function revalidateAll() {
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
}

export async function setReviewStatusAction(
  id: string,
  status: "pending" | "published" | "hidden"
): Promise<ReviewActionResult> {
  await requireAdmin();
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Invalid review." };
  if (!["pending", "published", "hidden"].includes(status))
    return { ok: false, error: "Invalid status." };
  try {
    await setReviewStatus(id, status);
    revalidateAll();
    return { ok: true };
  } catch (err) {
    console.error("[setReviewStatusAction]", err);
    return { ok: false, error: "Could not update the review." };
  }
}

export async function toggleReviewFeatured(
  id: string,
  featured: boolean
): Promise<ReviewActionResult> {
  await requireAdmin();
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Invalid review." };
  try {
    await setReviewFeatured(id, featured);
    revalidateAll();
    return { ok: true };
  } catch (err) {
    console.error("[toggleReviewFeatured]", err);
    return { ok: false, error: "Could not update the review." };
  }
}

export async function deleteReviewAction(id: string): Promise<ReviewActionResult> {
  await requireAdmin();
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Invalid review." };
  try {
    await deleteReview(id);
    revalidateAll();
    return { ok: true };
  } catch (err) {
    console.error("[deleteReviewAction]", err);
    return { ok: false, error: "Could not delete the review." };
  }
}

const SourceSchema = z.object({
  source: z.string().trim().min(1).max(40),
  label: z.string().trim().max(120).optional().nullable(),
  profile_url: z.string().trim().max(1000).optional().nullable(),
  rating_value: z.string().trim().max(20).optional().nullable(),
  badge_label: z.string().trim().max(120).optional().nullable(),
  enabled: z.boolean().optional(),
});

export async function saveReviewSource(input: unknown): Promise<ReviewActionResult> {
  await requireAdmin();
  const parsed = SourceSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  try {
    await upsertReviewSource(parsed.data);
    revalidateAll();
    return { ok: true };
  } catch (err) {
    console.error("[saveReviewSource]", err);
    return { ok: false, error: "Could not save the source." };
  }
}
