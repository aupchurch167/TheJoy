"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { sendPartnerEmail } from "@/lib/email";
import {
  addReferral,
  addReminder,
  deleteReminder,
  getPartner,
  insertPartner,
  logActivity,
  markPartnerClosed,
  partnerOrgExists,
  patchPartner,
  toggleReminder,
  updatePartner,
} from "@/lib/partners";
import {
  ACTIVITY_TYPES,
  CALL_OUTCOMES,
  PARTNER_CATEGORIES,
  PARTNER_STATUSES,
  REFERRAL_OUTCOMES,
  formatWeekdayShort,
} from "@/lib/partners-vocab";
import { parsePartnersCsv } from "@/lib/partners-import";

// Literal-preserving enums (keeps PartnerStatus/Tier/Owner unions downstream).
const statusEnum = z.enum(PARTNER_STATUSES);
const tierEnum = z.enum(["A", "B", "C"] as const);
const ownerEnum = z.enum(["adam", "mellissa", "both"] as const);
const categoryEnum = z.enum(
  PARTNER_CATEGORIES.map((c) => c.value) as [string, ...string[]]
);

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

const PartnerSchema = z.object({
  organization: z.string().trim().min(1, "Organization is required.").max(200),
  category: categoryEnum.default("other"),
  tier: z.preprocess(emptyToNull, tierEnum.nullable().default(null)),
  status: statusEnum.default("not_contacted"),
  contact_name: z.preprocess(emptyToNull, z.string().trim().max(160).nullable().default(null)),
  contact_role: z.preprocess(emptyToNull, z.string().trim().max(160).nullable().default(null)),
  phone: z.preprocess(emptyToNull, z.string().trim().max(60).nullable().default(null)),
  email: z.preprocess(emptyToNull, z.string().trim().max(200).nullable().default(null)),
  website: z.preprocess(emptyToNull, z.string().trim().max(300).nullable().default(null)),
  service_area: z.preprocess(emptyToNull, z.string().trim().max(200).nullable().default(null)),
  owner: ownerEnum.default("both"),
  next_action: z.preprocess(emptyToNull, z.string().trim().max(300).nullable().default(null)),
  next_date: z.preprocess(emptyToNull, z.string().trim().max(30).nullable().default(null)),
  notes: z.preprocess(emptyToNull, z.string().trim().max(4000).nullable().default(null)),
});

export type PartnerActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export async function createPartner(input: unknown): Promise<PartnerActionResult> {
  await requireAdmin();
  const parsed = PartnerSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  try {
    if (await partnerOrgExists(parsed.data.organization))
      return { ok: false, error: "A partner with that organization already exists." };
    const p = await insertPartner(parsed.data);
    revalidatePath("/admin/partners");
    return { ok: true, id: p.id };
  } catch (err) {
    console.error("[createPartner]", err);
    return { ok: false, error: "Could not save. Is the database connected?" };
  }
}

export async function updatePartnerAction(input: unknown): Promise<PartnerActionResult> {
  await requireAdmin();
  const parsed = PartnerSchema.extend({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  const { id, ...fields } = parsed.data;
  try {
    await updatePartner(id, fields);
    revalidatePath("/admin/partners");
    revalidatePath(`/admin/partners/${id}`);
    return { ok: true, id };
  } catch (err) {
    console.error("[updatePartnerAction]", err);
    return { ok: false, error: "Could not save changes." };
  }
}

/* ---- Log activity (touch) ---- */

const LogSchema = z.object({
  partnerId: z.string().uuid(),
  type: z.enum(ACTIVITY_TYPES),
  note: z.preprocess(emptyToNull, z.string().trim().max(2000).nullable().default(null)),
  callOutcome: z.preprocess(emptyToNull, z.enum(CALL_OUTCOMES).nullable().default(null)),
  callDuration: z.preprocess(emptyToNull, z.string().trim().max(40).nullable().default(null)),
  status: z.preprocess(emptyToNull, statusEnum.nullable().default(null)),
  nextAction: z.preprocess(emptyToNull, z.string().trim().max(300).nullable().default(null)),
  nextDate: z.preprocess(emptyToNull, z.string().trim().max(30).nullable().default(null)),
});

export type LogTouchResult =
  | { ok: true; toast: string }
  | { ok: false; error: string };

export async function logTouch(input: unknown): Promise<LogTouchResult> {
  const { email } = await requireAdmin();
  const parsed = LogSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  const d = parsed.data;
  try {
    await logActivity({
      partnerId: d.partnerId,
      type: d.type,
      note: d.note,
      callOutcome: d.callOutcome,
      callDuration: d.callDuration,
      status: d.status,
      nextAction: d.nextAction,
      nextDate: d.nextDate,
      loggedBy: email,
    });
    const partner = await getPartner(d.partnerId);
    revalidatePath("/admin/partners");
    revalidatePath(`/admin/partners/${d.partnerId}`);

    // Toast: "Touch saved. Next: call {first} on {weekday, short date}."
    let toast = "Touch saved.";
    if (partner?.next_action) {
      const first = (partner.contact_name || "").trim().split(/\s+/)[0];
      const when = formatWeekdayShort(partner.next_date);
      const bits = [partner.next_action, first ? first : null]
        .filter(Boolean)
        .join(" ");
      toast = `Touch saved. Next: ${bits}${when ? ` on ${when}` : ""}.`;
    }
    return { ok: true, toast };
  } catch (err) {
    console.error("[logTouch]", err);
    return { ok: false, error: "Could not save the touch." };
  }
}

/* ---- Sidebar inline patch (owner / next step / notes / status) ---- */

const PatchSchema = z.object({
  id: z.string().uuid(),
  owner: ownerEnum.optional(),
  status: statusEnum.optional(),
  next_action: z.preprocess(emptyToNull, z.string().trim().max(300).nullable()).optional(),
  next_date: z.preprocess(emptyToNull, z.string().trim().max(30).nullable()).optional(),
  notes: z.preprocess(emptyToNull, z.string().trim().max(4000).nullable()).optional(),
});

export async function patchPartnerField(input: unknown): Promise<PartnerActionResult> {
  await requireAdmin();
  const parsed = PatchSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  const { id, ...fields } = parsed.data;
  try {
    await patchPartner(id, fields);
    revalidatePath("/admin/partners");
    revalidatePath(`/admin/partners/${id}`);
    return { ok: true, id };
  } catch (err) {
    console.error("[patchPartnerField]", err);
    return { ok: false, error: "Could not update." };
  }
}

export async function markClosed(id: string): Promise<PartnerActionResult> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success)
    return { ok: false, error: "Invalid partner." };
  try {
    await markPartnerClosed(id);
    revalidatePath("/admin/partners");
    revalidatePath(`/admin/partners/${id}`);
    return { ok: true, id };
  } catch (err) {
    console.error("[markClosed]", err);
    return { ok: false, error: "Could not close this partner." };
  }
}

/* ---- Reminders ---- */

const ReminderSchema = z.object({
  partnerId: z.string().uuid(),
  label: z.string().trim().min(1, "Add a short label.").max(200),
  dueDate: z.preprocess(emptyToNull, z.string().trim().max(30).nullable().default(null)),
});

export async function addReminderAction(input: unknown): Promise<PartnerActionResult> {
  const { email } = await requireAdmin();
  const parsed = ReminderSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  try {
    await addReminder(parsed.data.partnerId, parsed.data.label, parsed.data.dueDate, email);
    revalidatePath(`/admin/partners/${parsed.data.partnerId}`);
    return { ok: true };
  } catch (err) {
    console.error("[addReminderAction]", err);
    return { ok: false, error: "Could not add the reminder." };
  }
}

export async function toggleReminderAction(
  id: string,
  done: boolean,
  partnerId: string
): Promise<PartnerActionResult> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid." };
  try {
    await toggleReminder(id, done);
    revalidatePath(`/admin/partners/${partnerId}`);
    return { ok: true };
  } catch (err) {
    console.error("[toggleReminderAction]", err);
    return { ok: false, error: "Could not update the reminder." };
  }
}

export async function deleteReminderAction(
  id: string,
  partnerId: string
): Promise<PartnerActionResult> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid." };
  try {
    await deleteReminder(id);
    revalidatePath(`/admin/partners/${partnerId}`);
    return { ok: true };
  } catch (err) {
    console.error("[deleteReminderAction]", err);
    return { ok: false, error: "Could not remove the reminder." };
  }
}

/* ---- Referrals ---- */

const ReferralSchema = z.object({
  partnerId: z.string().uuid(),
  occurredOn: z.preprocess(emptyToNull, z.string().trim().max(30).nullable().default(null)),
  familyLabel: z.preprocess(emptyToNull, z.string().trim().max(120).nullable().default(null)),
  outcome: z.enum(REFERRAL_OUTCOMES).default("inquiry"),
  notes: z.preprocess(emptyToNull, z.string().trim().max(1000).nullable().default(null)),
});

export async function addReferralAction(input: unknown): Promise<PartnerActionResult> {
  await requireAdmin();
  const parsed = ReferralSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  try {
    await addReferral(parsed.data);
    revalidatePath(`/admin/partners/${parsed.data.partnerId}`);
    revalidatePath("/admin/partners");
    return { ok: true };
  } catch (err) {
    console.error("[addReferralAction]", err);
    return { ok: false, error: "Could not add the referral." };
  }
}

/* ---- Email composer (sends + logs an Email touch) ---- */

const EmailSchema = z.object({
  partnerId: z.string().uuid(),
  to: z
    .string()
    .trim()
    .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "A valid email is required."),
  subject: z.string().trim().min(1, "Add a subject.").max(300),
  body: z.string().trim().min(1, "Write a message.").max(20000),
  attachments: z
    .array(
      z.object({
        filename: z.string().trim().min(1).max(200),
        content: z.string().min(1).max(9_000_000), // base64
      })
    )
    .max(6)
    .default([]),
});

export async function sendPartnerEmailAction(input: unknown): Promise<PartnerActionResult> {
  const { email } = await requireAdmin();
  const parsed = EmailSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  const d = parsed.data;
  try {
    const sent = await sendPartnerEmail({
      to: d.to,
      subject: d.subject,
      bodyMarkdown: d.body,
      attachments: d.attachments,
    });
    if (!sent) {
      return {
        ok: false,
        error: "Email is not configured (RESEND_API_KEY). Nothing was sent.",
      };
    }
    // Log the send as an Email touch on the timeline.
    await logActivity({
      partnerId: d.partnerId,
      type: "email",
      note: d.subject,
      loggedBy: email,
    });
    revalidatePath("/admin/partners");
    revalidatePath(`/admin/partners/${d.partnerId}`);
    return { ok: true };
  } catch (err) {
    console.error("[sendPartnerEmailAction]", err);
    return { ok: false, error: "Could not send the email." };
  }
}

/* ---- CSV import (dry-run preview + commit) ---- */

export type ImportPartnersResult =
  | {
      ok: true;
      committed: boolean;
      parsed: number;
      added: number;
      alreadyInList: number;
      noOrg: number;
      dupeInFile: number;
      failed: number;
      message: string;
    }
  | { ok: false; error: string };

const ImportSchema = z.object({
  csv: z.string().min(1).max(4_000_000),
  commit: z.boolean().default(false),
  map: z.record(z.string(), z.number().int().min(0).max(2000)),
});

export async function importPartners(input: unknown): Promise<ImportPartnersResult> {
  await requireAdmin();
  const parsed = ImportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const map = parsed.data.map as Record<string, number>;
  if (map.organization === undefined)
    return { ok: false, error: "Map the Organization column before continuing." };

  const commit = parsed.data.commit === true;
  const { rows, noOrg, dupeInFile } = parsePartnersCsv(parsed.data.csv, map);

  let added = 0;
  let alreadyInList = 0;
  let failed = 0;

  for (const r of rows) {
    try {
      if (await partnerOrgExists(r.organization)) {
        alreadyInList++;
        continue;
      }
      if (commit) {
        await insertPartner({
          organization: r.organization,
          category: r.category,
          tier: r.tier,
          status: r.status,
          contact_name: r.contact_name,
          contact_role: r.contact_role,
          phone: r.phone,
          email: r.email,
          notes: r.notes,
          source: "import",
        });
      }
      added++;
    } catch (err) {
      console.error("[importPartners] row failed", err);
      failed++;
    }
  }

  if (commit) revalidatePath("/admin/partners");

  const message = commit
    ? `Imported ${added} partner${added === 1 ? "" : "s"}. ${alreadyInList} already on the list.`
    : `Ready to import ${added} partner${added === 1 ? "" : "s"}. ${alreadyInList} already on the list.`;

  return {
    ok: true,
    committed: commit,
    parsed: rows.length,
    added,
    alreadyInList,
    noOrg,
    dupeInFile,
    failed,
    message,
  };
}
