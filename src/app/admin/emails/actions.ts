"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import {
  createBroadcast,
  updateBroadcast,
  scheduleBroadcast,
  deleteBroadcast,
  getBroadcastById,
} from "@/lib/broadcasts";
import { processDueBroadcasts } from "@/lib/broadcast-runner";
import { emailEnabled } from "@/lib/email";

const BaseSchema = z.object({
  id: z.string().uuid().optional(),
  subject: z.string().trim().min(1, "A subject is required.").max(200),
  body: z.string().max(50000).optional(),
  audience: z.enum(["leads", "families"]).default("leads"),
});

async function upsert(
  id: string | undefined,
  subject: string,
  body: string,
  audience: "leads" | "families"
) {
  if (id) {
    const updated = await updateBroadcast(id, subject, body);
    if (updated) return updated.id;
  }
  const created = await createBroadcast(subject, body, audience);
  return created.id;
}

export type ActionResult =
  | { ok: true; id: string; message: string }
  | { ok: false; error: string };

export async function saveDraft(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = BaseSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  try {
    const id = await upsert(
      parsed.data.id,
      parsed.data.subject,
      parsed.data.body ?? "",
      parsed.data.audience
    );
    revalidatePath("/admin/emails");
    return { ok: true, id, message: "Saved as draft." };
  } catch (err) {
    console.error("[saveDraft]", err);
    return { ok: false, error: "Could not save. Is the database connected?" };
  }
}

const SendSchema = BaseSchema.extend({
  // ISO datetime for scheduling; omit / empty = send now.
  when: z.string().trim().optional(),
});

export async function sendOrSchedule(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = SendSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };

  if (!emailEnabled()) {
    return {
      ok: false,
      error:
        "Email is not set up yet (RESEND_API_KEY). Add it before sending (see OPERATIONS.md).",
    };
  }

  try {
    const id = await upsert(
      parsed.data.id,
      parsed.data.subject,
      parsed.data.body ?? "",
      parsed.data.audience
    );

    const now = new Date();
    const when = parsed.data.when ? new Date(parsed.data.when) : now;
    const sendNow = !parsed.data.when || when <= now;
    const scheduledAt = (sendNow ? now : when).toISOString();

    await scheduleBroadcast(id, scheduledAt);

    if (sendNow) {
      const sent = await processDueBroadcasts();
      revalidatePath("/admin/emails");
      return { ok: true, id, message: `Sent to ${sent} lead(s).` };
    }

    revalidatePath("/admin/emails");
    return {
      ok: true,
      id,
      message: `Scheduled for ${when.toLocaleString()}. It sends on the next cron run after that.`,
    };
  } catch (err) {
    console.error("[sendOrSchedule]", err);
    return { ok: false, error: "Could not send. Please try again." };
  }
}

export async function removeBroadcast(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    const b = await getBroadcastById(id);
    if (b && b.status === "sent") return { ok: false };
    await deleteBroadcast(id);
    revalidatePath("/admin/emails");
    return { ok: true };
  } catch (err) {
    console.error("[removeBroadcast]", err);
    return { ok: false };
  }
}
