"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { query } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getSmsRecipients, markSmsOptOut } from "@/lib/leads";
import {
  createBroadcast,
  markBroadcastSent,
  recordRecipient,
} from "@/lib/broadcasts";
import { sendSms, smsEnabled, parseSmsNumbers } from "@/lib/sms";

// Opt-out line appended to every text, per SMS compliance best practice.
const OPT_OUT = "Reply STOP to opt out.";
// A blast is only allowed if the exact message was tested within this window.
const TEST_VALID_MINUTES = 60;

const BodySchema = z
  .string()
  .trim()
  .min(1, "Write a message first.")
  .max(1000, "Keep texts short (under 1000 characters).");

/** The exact bytes that get sent (message + opt-out line). */
function fullContent(body: string): string {
  return `${body.trim()}\n\n${OPT_OUT}`;
}
/** Stable hash of the message, used to gate the blast on a matching test. */
function bodyHash(body: string): string {
  return createHash("sha256").update(fullContent(body)).digest("hex");
}

/** Owner/admin numbers (from Settings) that receive the required test. */
async function getTestNumbers(): Promise<string[]> {
  const settings = await getSettings();
  return parseSmsNumbers(settings.sms_test_numbers);
}

async function recordTest(hash: string): Promise<void> {
  await query(
    `INSERT INTO sms_tests (body_hash, tested_at) VALUES ($1, now())
     ON CONFLICT (body_hash) DO UPDATE SET tested_at = now()`,
    [hash]
  );
}
async function wasTestedRecently(hash: string): Promise<boolean> {
  const rows = await query<{ ok: boolean }>(
    `SELECT true AS ok FROM sms_tests
      WHERE body_hash = $1 AND tested_at > now() - ($2 || ' minutes')::interval
      LIMIT 1`,
    [hash, String(TEST_VALID_MINUTES)]
  );
  return rows.length > 0;
}

export type TestResult =
  | { ok: true; sent: number; failed: number; total: number }
  | { ok: false; error: string };

/**
 * Required step: send the exact message to the owner/admin test numbers. On at
 * least one success, the message is marked tested so the blast unlocks.
 */
export async function sendTestToAdmins(input: unknown): Promise<TestResult> {
  await requireAdmin();
  const parsed = BodySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  }
  if (!smsEnabled()) {
    return { ok: false, error: "Texting is not configured yet (see OPERATIONS.md)." };
  }
  const numbers = await getTestNumbers();
  if (numbers.length === 0) {
    return {
      ok: false,
      error:
        "No test numbers set. Add owner/admin phone numbers in Settings → Text test numbers.",
    };
  }

  const content = fullContent(parsed.data);
  let sent = 0;
  let failed = 0;
  for (const n of numbers) {
    const res = await sendSms(n, content);
    if (res.ok) sent++;
    else failed++;
    await new Promise((r) => setTimeout(r, 120));
  }
  if (sent === 0) {
    return {
      ok: false,
      error: "Every test text failed. Check the number(s) and Quo setup.",
    };
  }
  await recordTest(bodyHash(parsed.data));
  return { ok: true, sent, failed, total: numbers.length };
}

export type BlastResult =
  | { ok: true; sent: number; failed: number; total: number }
  | { ok: false; error: string; needsTest?: boolean };

/** Send a text blast to opted-in, active family contacts. Gated on a test. */
export async function sendTextBlast(input: unknown): Promise<BlastResult> {
  await requireAdmin();
  const parsed = BodySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  }
  if (!smsEnabled()) {
    return { ok: false, error: "Texting is not configured yet (see OPERATIONS.md)." };
  }

  // Gate: this exact message must have been test-sent to the owners/admins.
  if (!(await wasTestedRecently(bodyHash(parsed.data)))) {
    return {
      ok: false,
      needsTest: true,
      error:
        "Send a test to the owners & admin first. The blast stays locked until this exact message has been tested.",
    };
  }

  const recipients = await getSmsRecipients();
  if (recipients.length === 0) {
    return {
      ok: false,
      error:
        "No text recipients. Turn on texting for active family contacts (with a phone) first.",
    };
  }

  const content = fullContent(parsed.data);
  const broadcast = await createBroadcast("", parsed.data, "families", "sms");

  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    const res = await sendSms(r.phone ?? "", content);
    await recordRecipient(broadcast.id, r.id, res.ok ? undefined : res.error);
    if (res.ok) sent++;
    else failed++;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  await markBroadcastSent(broadcast.id, sent);
  revalidatePath("/admin/texts");
  return { ok: true, sent, failed, total: recipients.length };
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
