"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import {
  saveLinkInBio,
  resetLinkInBio,
  validateLinkInBio,
  linkInBioDefaults,
  type LinkInBioContent,
} from "@/lib/linkinbio";

export type LinkInBioResult =
  | { ok: true; message: string; content: LinkInBioContent }
  | { ok: false; error: string };

export async function saveLinkInBioContent(
  content: LinkInBioContent
): Promise<LinkInBioResult> {
  await requireAdmin();

  const err = validateLinkInBio(content);
  if (err) return { ok: false, error: err };

  try {
    await saveLinkInBio(content);
    revalidatePath("/links");
    return {
      ok: true,
      message: "Saved. The links page updates within a moment.",
      content,
    };
  } catch (e) {
    console.error("[saveLinkInBioContent]", e);
    return { ok: false, error: "Could not save. Is the database connected?" };
  }
}

export async function resetLinkInBioContent(): Promise<LinkInBioResult> {
  await requireAdmin();
  try {
    await resetLinkInBio();
    revalidatePath("/links");
    return {
      ok: true,
      message: "Reset to the shipped defaults.",
      content: linkInBioDefaults(),
    };
  } catch (e) {
    console.error("[resetLinkInBioContent]", e);
    return { ok: false, error: "Could not reset. Is the database connected?" };
  }
}
