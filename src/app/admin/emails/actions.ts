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
  countNonOpeners,
  type SavedSegment,
} from "@/lib/broadcasts";
import {
  processDueBroadcasts,
  throttleSummary,
} from "@/lib/broadcast-runner";
import { countSubscribers, type LeadSegment } from "@/lib/leads";
import { emailEnabled, sendTestEmail } from "@/lib/email";
import {
  renderEmailModel,
  EMAIL_THEMES,
  type EmailModel,
  type EmailTheme,
} from "@/lib/email-model";

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
  // Designed HTML can run long, so allow more than the Markdown limit.
  body: z.string().max(200000).optional(),
  audience: z.enum(["leads", "families"]).default("leads"),
  filters: FiltersSchema,
  format: z.enum(["markdown", "html", "html_standalone"]).default("markdown"),
});

async function upsert(
  id: string | undefined,
  subject: string,
  body: string,
  audience: "leads" | "families",
  filters: LeadSegment | null,
  format: "markdown" | "html" | "html_standalone"
) {
  if (id) {
    const updated = await updateBroadcast(id, subject, body, filters, format);
    if (updated) return updated.id;
  }
  const created = await createBroadcast(subject, body, audience, "email", filters, null, {
    format,
  });
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
      normalizeFilters(parsed.data.filters),
      parsed.data.format
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
      normalizeFilters(parsed.data.filters),
      parsed.data.format
    );

    const now = new Date();
    const when = parsed.data.when ? new Date(parsed.data.when) : now;
    const sendNow = !parsed.data.when || when <= now;
    const scheduledAt = (sendNow ? now : when).toISOString();

    await scheduleBroadcast(id, scheduledAt);

    if (sendNow) {
      // A resend-to-non-openers targets the parent's non-openers, not a segment.
      const saved = await getBroadcastById(id);
      const total = saved?.resend_of
        ? await countNonOpeners(saved.resend_of)
        : await countSubscribers(
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
  body: z.string().max(200000).optional(),
  format: z.enum(["markdown", "html", "html_standalone"]).default("markdown"),
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
    const ok = await sendTestEmail(
      to,
      parsed.data.subject,
      parsed.data.body ?? "",
      parsed.data.format
    );
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
      b.filters,
      null,
      { format: b.body_format }
    );
    revalidatePath("/admin/emails");
    return { ok: true, id: copy.id };
  } catch (err) {
    console.error("[duplicateBroadcast]", err);
    return { ok: false };
  }
}

/** Start a follow-up email to everyone who didn't open the original. */
export async function resendToNonOpeners(
  parentId: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    const parent = await getBroadcastById(parentId);
    if (!parent) return { ok: false, error: "Original email not found." };
    const remaining = await countNonOpeners(parentId);
    if (remaining === 0) {
      return {
        ok: false,
        error: "No non-openers yet (or opens are still coming in).",
      };
    }
    const draft = await createBroadcast(
      parent.subject,
      parent.body,
      parent.audience,
      "email",
      null,
      parentId,
      { format: parent.body_format }
    );
    revalidatePath("/admin/emails");
    return { ok: true, id: draft.id };
  } catch (err) {
    console.error("[resendToNonOpeners]", err);
    return { ok: false, error: "Could not start the resend." };
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

/* ------------------------------------------------------------------ */
/* STUDIO COMPOSER (structured model → themed standalone HTML)         */
/* ------------------------------------------------------------------ */

const THEME_IDS = EMAIL_THEMES.map((t) => t.id) as [EmailTheme, ...EmailTheme[]];

const ModelSchema = z.object({
  theme: z.enum(THEME_IDS),
  eyebrow: z.string().max(120).optional(),
  heroTitle: z.string().max(200).optional(),
  heroSub: z.string().max(200).optional(),
  greeting: z.string().max(200).default(""),
  intro: z.string().max(8000).default(""),
  plan: z
    .object({
      label: z.string().max(80).optional(),
      when: z.string().max(300).optional(),
      where: z.string().max(300).optional(),
      treats: z.string().max(300).optional(),
    })
    .nullable()
    .optional(),
  rsvpUrl: z.string().trim().max(500).nullable().optional(),
  photoUrl: z.string().trim().max(1000).nullable().optional(),
  closing: z.string().max(2000).default(""),
});

const StudioSaveSchema = z.object({
  id: z.string().uuid().optional(),
  subject: z.string().trim().max(200).default(""),
  audience: z.enum(["leads", "families"]).default("families"),
  filters: FiltersSchema,
  model: ModelSchema,
});

const StudioSendSchema = StudioSaveSchema.extend({
  when: z.string().trim().optional(),
});

/** Render the studio model server-side (single source of truth for the HTML). */
function renderModel(m: z.infer<typeof ModelSchema>): string {
  return renderEmailModel(m as EmailModel);
}

/** Persist a studio email (create or update), storing both model and HTML. */
async function upsertStudio(
  id: string | undefined,
  subject: string,
  model: z.infer<typeof ModelSchema>,
  audience: "leads" | "families",
  filters: LeadSegment | null
): Promise<string> {
  const body = renderModel(model);
  if (id) {
    const updated = await updateBroadcast(
      id,
      subject,
      body,
      filters,
      "html_standalone",
      model
    );
    if (updated) return updated.id;
  }
  const created = await createBroadcast(subject, body, audience, "email", filters, null, {
    format: "html_standalone",
    modelJson: model,
  });
  return created.id;
}

export async function saveStudioDraft(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = StudioSaveSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  try {
    const id = await upsertStudio(
      parsed.data.id,
      parsed.data.subject || "(no subject yet)",
      parsed.data.model,
      parsed.data.audience,
      normalizeFilters(parsed.data.filters)
    );
    revalidatePath("/admin/emails");
    return { ok: true, id, message: "Draft saved." };
  } catch (err) {
    console.error("[saveStudioDraft]", err);
    return { ok: false, error: "Could not save. Is the database connected?" };
  }
}

export async function sendStudioOrSchedule(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = StudioSendSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  if (!parsed.data.subject.trim())
    return { ok: false, error: "Add a subject before sending." };
  if (!emailEnabled()) {
    return {
      ok: false,
      error:
        "Email is not set up yet (RESEND_API_KEY). Add it before sending (see OPERATIONS.md).",
    };
  }

  try {
    const id = await upsertStudio(
      parsed.data.id,
      parsed.data.subject,
      parsed.data.model,
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
    console.error("[sendStudioOrSchedule]", err);
    return { ok: false, error: "Could not send. Please try again." };
  }
}

const StudioTestSchema = z.object({
  subject: z.string().trim().max(200).default("Test from Joy"),
  model: ModelSchema,
  to: z.string().trim().email("Enter a valid test email address.").optional().or(z.literal("")),
});

export async function sendStudioTest(input: unknown): Promise<TestResult> {
  await requireAdmin();
  const parsed = StudioTestSchema.safeParse(input);
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
      error: "Enter a test email address (or set LEAD_NOTIFY_TO for a default).",
    };
  }
  try {
    const ok = await sendTestEmail(
      to,
      parsed.data.subject || "Test from Joy",
      renderModel(parsed.data.model),
      "html_standalone"
    );
    if (!ok) return { ok: false, error: "Email is not configured." };
    return { ok: true, message: `Test sent to ${to}. Check your inbox.` };
  } catch (err) {
    console.error("[sendStudioTest]", err);
    return { ok: false, error: "Could not send the test. Please try again." };
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
