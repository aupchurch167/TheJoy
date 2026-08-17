"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { query } from "@/lib/db";
import { SITE_PHOTO_SLOTS } from "@/lib/site-photos";
import { isValidHttpUrl } from "@/lib/settings-meta";

const VALID_KEYS = new Set(SITE_PHOTO_SLOTS.map((s) => s.settingKey));

export type PhotoSaveResult = { ok: true } | { ok: false; error: string };

/**
 * Set (or clear) one site photo. An http(s) URL or an uploaded path is stored;
 * an empty value clears the override so the slot falls back to the default.
 */
export async function saveSitePhoto(
  settingKey: string,
  url: string
): Promise<PhotoSaveResult> {
  await requireAdmin();
  if (!VALID_KEYS.has(settingKey)) {
    return { ok: false, error: "Unknown photo." };
  }
  const value = (url ?? "").trim();
  // Allow empty (clear), an uploaded/relative path (/...), or a full http(s) URL.
  if (value !== "" && !value.startsWith("/") && !isValidHttpUrl(value)) {
    return { ok: false, error: "Enter a valid image URL, or upload a photo." };
  }
  try {
    await query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [settingKey, value]
    );
    // These photos appear across the marketing site.
    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/services", "layout");
    revalidatePath("/memory-care");
    revalidatePath("/admin/media");
    return { ok: true };
  } catch (err) {
    console.error("[saveSitePhoto]", err);
    return { ok: false, error: "Could not save. Is the database connected?" };
  }
}
