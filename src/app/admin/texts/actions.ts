"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { getSmsRecipients, markSmsOptOut } from "@/lib/leads";
import {
  createBroadcast,
  markBroadcastSent,
  recordRecipient,
} from "@/lib/broadcasts";
import { sendSms, smsEnabled, toE164 } from "@/lib/sms";

// Opt-out line appended to every blast, per SMS compliance best practice.
const OPT_OUT = "Reply STOP to opt out.";

const BodySchema = z
  .string()
  .trim()
  .min(1, "Write a message first.")
  .max(1000, "Keep texts short (under 1000 characters).");

export type TextResult =
  | { ok: true; sent: number; failed: number; total: number }
  | { ok: false; error: string };

/** Send a text blast to all opted-in, active family contacts with a phone. */
export async function sendTextBlast(input: unknown): Promise<TextResult> {
  await requireAdmin();
  const parsed = BodySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  }
  if (!smsEnabled()) {
    return { ok: false, error: "Texting is not configured yet (see OPERATIONS.md)." };
  }

  const recipients = await getSmsRecipients();
  if (recipients.length === 0) {
    return {
      ok: false,
      error:
        "No text recipients. Turn on texting for active family contacts (with a phone) first.",
    };
  }

  const content = `${parsed.data}\n\n${OPT_OUT}`;
  const broadcast = await createBroadcast("", parsed.data, "families", "sms");

  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    const res = await sendSms(r.phone ?? "", content);
    await recordRecipient(broadcast.id, r.id, res.ok ? undefined : res.error);
    if (res.ok) sent++;
    else failed++;
    // Gentle pacing to stay under Quo's rate limit.
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  await markBroadcastSent(broadcast.id, sent);
  revalidatePath("/admin/texts");
  return { ok: true, sent, failed, total: recipients.length };
}

/** Send a single test text to a number, to confirm setup before a blast. */
export async function sendTestText(
  body: string,
  phone: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  if (!smsEnabled()) return { ok: false, error: "Texting is not configured yet." };
  if (!toE164(phone)) return { ok: false, error: "Enter a valid US phone number." };
  return sendSms(phone, `${parsed.data}\n\n${OPT_OUT}`);
}

/** Manually opt a contact out of texts (e.g. they asked to stop). */
export async function optOutOfTexts(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await markSmsOptOut(id);
    revalidatePath("/admin/families");
    revalidatePath("/admin/texts");
    return { ok: true };
  } catch (err) {
    console.error("[optOutOfTexts]", err);
    return { ok: false };
  }
}
