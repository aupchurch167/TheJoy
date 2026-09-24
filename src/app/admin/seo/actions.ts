"use server";

import { requireAdmin } from "@/lib/require-admin";
import { submitToIndexNow, type IndexNowResult } from "@/lib/indexnow";
import sitemap from "@/app/sitemap";

/** Submit every URL in the sitemap to IndexNow (Bing). */
export async function submitSitemapToIndexNow(): Promise<IndexNowResult> {
  await requireAdmin();
  const entries = await sitemap();
  return submitToIndexNow(entries.map((e) => e.url));
}
