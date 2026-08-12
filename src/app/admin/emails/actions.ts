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
  createSavedSegment,
  deleteSavedSegment,
  type SavedSegment,
} from "@/lib/broadcasts";
import {
  processDueBroadcasts,
  throttleSummary,
} from "@/lib/broadcast-runner";
import { countSubscribers, type LeadSegment } from "@/lib/leads";
import { emailEnabled, sendTestEmail } from "@/lib/email";

// Recipient segment. Empty arrays / blanks are normalized to "no filter".
const FiltersSchema = z
  .object({
    sources: z.array(z.string().trim().max(80)).max(200).optional(),
    stages: z.array(z.enum(["new", "toured", "moved_in", "lost"])).optional(),
    createdFrom: z.string().trim().optional(),
    createdTo: z.string().trim().optional(),
  })
  .optional();

/** Drop empty parts so an all-empty segment persists as null (whole audience). */
function normalizeFilters(f: z.infer<typeof FiltersSchema>): LeadSegment | null {
  if (!f) return null;
  const seg: LeadSegment = {};
  if (f.sources?.length) seg.sources = f.sources;
  if (f.stages?.length) seg.stages = f.stages;
  if (f.createdFrom) seg.createdFrom = new Date(f.createdFrom).toISOString();
  if (f.createdTo) seg.createdTo = new Date(f.createdTo).toISOString();
  return Object.keys(seg).length ? seg : null;
}

const BaseSchema = z.object({
  id: z.string().uuid().optional(),
  subject: z.string().trim().min(1, "A subject is required.").max(200),
  body: z.string().max(50000).optional(),
  audience: z.enum(["leads", "families"]).default("leads"),
  filters: FiltersSchema,
});

async function upsert(
  id: string | undefined,
  subject: string,
  body: string,
  audience: "leads" | "families",
  filters: LeadSegment | null
) {
  if (id) {
    const updated = await updateBroadcast(id, subject, body, filters);
    if (updated) return updated.id;
  }
  const created = await createBroadcast(subject, body, audience, "email", filters);
  return created.id;
}

/** Live recipient count for the composer as filters change. */
export async function previewRecipients(input: unknown): Promise<number> {
  await requireAdmin();
  const parsed = z
    .object({
      audience: z.enum(["leads", "families"]).default("leads"),
      filters: FiltersSchema,
    })
    .safeParse(input);
  if (!parsed.success) return 0;
  try {
    return await countSubscribers(
      parsed.data.audience,
      normalizeFilters(parsed.data.filters) ?? undefined
    );
  } catch {
    return 0;
  }
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
      parsed.data.audience,
      normalizeFilters(parsed.data.filters)
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
      parsed.data.audience,
      normalizeFilters(parsed.data.filters)
    );

    const now = new Date();
    const when = parsed.data.when ? new Date(parsed.data.when) : now;
    const sendNow = !parsed.data.when || when <= now;
    const scheduledAt = (sendNow ? now : when).toISOString();

    await scheduleBroadcast(id, scheduledAt);

    if (sendNow) {
      const total = await countSubscribers(
        parsed.data.audience,
        normalizeFilters(parsed.data.filters) ?? undefined
      );
      const sent = await processDueBroadcasts();
      revalidatePath("/admin/emails");

      const remaining = Math.max(0, total - sent);
      let message: string;
      if (total === 0) {
        message = "No recipients match. Nothing was sent.";
      } else if (sent === 0) {
        message = `Queued for ${total} recipient(s). Sending is metered (${throttleSummary()}) and picks up in the next send window.`;
      } else if (remaining > 0) {
        message = `Sending to ${total}. ${sent} went out now; the rest send gradually (${throttleSummary()}) to protect deliverability.`;
      } else {
        message = `Sent to ${sent} recipient(s).`;
      }
      return { ok: true, id, message };
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

const TestSchema = z.object({
  subject: z.string().trim().min(1, "Add a subject before testing.").max(200),
  body: z.string().max(50000).optional(),
  to: z
    .string()
    .trim()
    .email("Enter a valid test email address.")
    .optional()
    .or(z.literal("")),
});

export type TestResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/**
 * Send a test copy of the current draft to one address before the real blast.
 * Falls back to the first LEAD_NOTIFY_TO address when no address is given.
 */
export async function sendTest(input: unknown): Promise<TestResult> {
  await requireAdmin();
  const parsed = TestSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };

  if (!emailEnabled()) {
    return {
      ok: false,
      error:
        "Email is not set up yet (RESEND_API_KEY). Add it before sending a test (see OPERATIONS.md).",
    };
  }

  const to =
    parsed.data.to ||
    (process.env.LEAD_NOTIFY_TO || "").split(",")[0]?.trim() ||
    "";
  if (!to) {
    return {
      ok: false,
      error:
        "Enter a test email address (or set LEAD_NOTIFY_TO for a default).",
    };
  }

  try {
    const ok = await sendTestEmail(to, parsed.data.subject, parsed.data.body ?? "");
    if (!ok) return { ok: false, error: "Email is not configured." };
    return { ok: true, message: `Test sent to ${to}. Check your inbox.` };
  } catch (err) {
    console.error("[sendTest]", err);
    return { ok: false, error: "Could not send the test. Please try again." };
  }
}

/** Clone a broadcast (any status) into a fresh draft you can edit and resend. */
export async function duplicateBroadcast(
  id: string
): Promise<{ ok: true; id: string } | { ok: false }> {
  await requireAdmin();
  try {
    const b = await getBroadcastById(id);
    if (!b) return { ok: false };
    const copy = await createBroadcast(
      `Copy of ${b.subject}`.slice(0, 200),
      b.body,
      b.audience,
      "email",
      b.filters
    );
    revalidatePath("/admin/emails");
    return { ok: true, id: copy.id };
  } catch (err) {
    console.error("[duplicateBroadcast]", err);
    return { ok: false };
  }
}

const SaveSegmentSchema = z.object({
  name: z.string().trim().min(1, "Name the segment.").max(80),
  audience: z.enum(["leads", "families"]).default("leads"),
  filters: FiltersSchema,
});

export async function saveSegment(
  input: unknown
): Promise<{ ok: true; segment: SavedSegment } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = SaveSegmentSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  const seg = normalizeFilters(parsed.data.filters);
  if (!seg) return { ok: false, error: "Add at least one filter to save." };
  try {
    const segment = await createSavedSegment(
      parsed.data.name,
      parsed.data.audience,
      seg
    );
    revalidatePath("/admin/emails");
    return { ok: true, segment };
  } catch (err) {
    console.error("[saveSegment]", err);
    return { ok: false, error: "Could not save the segment." };
  }
}

export async function removeSegment(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await deleteSavedSegment(id);
    revalidatePath("/admin/emails");
    return { ok: true };
  } catch (err) {
    console.error("[removeSegment]", err);
    return { ok: false };
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
