"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { saveSettings } from "@/lib/settings";
import { validateSetting } from "@/lib/settings-meta";

export type SettingsResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function saveSiteSettings(
  entries: { key: string; value: string }[]
): Promise<SettingsResult> {
  await requireAdmin();

  if (!Array.isArray(entries) || entries.length === 0) {
    return { ok: false, error: "Nothing to save." };
  }

  // Validate every field first (URL keys must be http(s) or empty; others non-empty).
  for (const { key, value } of entries) {
    const err = validateSetting(key, value ?? "");
    if (err) return { ok: false, error: err };
  }

  try {
    await saveSettings(entries);
    // These values appear in the shared layout (header/footer) on every page,
    // so revalidate the whole layout tree. This makes edits show promptly even
    // behind Cloudflare (paired with a short edge TTL on the site's cache rule).
    revalidatePath("/", "layout");
    return { ok: true, message: "Saved. The site updates within a moment." };
  } catch (err) {
    console.error("[saveSiteSettings]", err);
    return { ok: false, error: "Could not save. Is the database connected?" };
  }
}
