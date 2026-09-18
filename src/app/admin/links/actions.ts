"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import {
  saveLinkInBioV2,
  resetLinkInBio,
  validateLinkInBioV2,
  linkInBioV2Defaults,
  LINKINBIO_TOUR_HREF,
  type LinkInBioContentV2,
} from "@/lib/linkinbio";

export type LinkInBioResult =
  | { ok: true; message: string; content: LinkInBioContentV2 }
  | { ok: false; error: string };

/** Coerce the tour-pinned link back to /tour before saving (defense in depth). */
function pinTour(content: LinkInBioContentV2): LinkInBioContentV2 {
  return {
    ...content,
    blocks: content.blocks.map((b) =>
      b.type === "link" && b.pinned === "tour"
        ? { ...b, url: LINKINBIO_TOUR_HREF }
        : b
    ),
  };
}

export async function saveLinkInBioContent(
  content: LinkInBioContentV2
): Promise<LinkInBioResult> {
  await requireAdmin();
  const pinned = pinTour(content);
  const err = validateLinkInBioV2(pinned);
  if (err) return { ok: false, error: err };
  try {
    await saveLinkInBioV2(pinned);
    revalidatePath("/links");
    return {
      ok: true,
      message: "Saved. The links page updates within a moment.",
      content: pinned,
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
      content: linkInBioV2Defaults(),
    };
  } catch (e) {
    console.error("[resetLinkInBioContent]", e);
    return { ok: false, error: "Could not reset. Is the database connected?" };
  }
}
