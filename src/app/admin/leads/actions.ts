"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { setLeadStage } from "@/lib/leads";

const Schema = z.object({
  id: z.string().uuid(),
  stage: z.enum(["new", "toured", "moved_in", "lost"]),
});

export async function updateLeadStage(input: unknown): Promise<{ ok: boolean }> {
  await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false };
  try {
    await setLeadStage(parsed.data.id, parsed.data.stage);
    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${parsed.data.id}`);
    return { ok: true };
  } catch (err) {
    console.error("[updateLeadStage]", err);
    return { ok: false };
  }
}
