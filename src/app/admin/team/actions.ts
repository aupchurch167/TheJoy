"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import {
  upsertEmployee,
  updateEmployee,
  setEmployeeActive,
  deleteEmployee,
  listReachableEmployees,
  employeeInAudience,
} from "@/lib/employees";
import {
  createSurvey,
  getSurveyById,
  setSurveyStatus,
  setSurveyAutoEnroll,
  deleteSurvey,
  ensureRecipient,
  markRecipientSent,
  type SurveyQuestion,
  type SurveyChannel,
} from "@/lib/employee-feedback";
import { sendEmployeeSurveyInvitation, emailEnabled } from "@/lib/email";
import { smsEnabled, sendSms, toE164 } from "@/lib/sms";
import { SITE_URL } from "@/lib/site";
import {
  syncEmployeesFromConnecteam,
  type SyncResult,
} from "@/lib/connecteam-sync";
import { connecteamEnabled } from "@/lib/connecteam";

export type ActionResult =
  | { ok: true; message?: string; id?: string }
  | { ok: false; error: string };

/* ---------------- roster ---------------- */

const EmployeeSchema = z.object({
  name: z.string().trim().min(1, "A name is required.").max(120),
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  title: z.string().trim().max(80).optional().or(z.literal("")),
  smsConsent: z.boolean().optional(),
});

export async function addEmployee(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = EmployeeSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  if (!parsed.data.email && !parsed.data.phone)
    return { ok: false, error: "Add an email or a phone so they can be reached." };
  try {
    const emp = await upsertEmployee({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      title: parsed.data.title || null,
      smsConsent: parsed.data.smsConsent,
      source: "manual",
    });
    revalidatePath("/admin/team/roster");
    return { ok: true, id: emp.id, message: "Added." };
  } catch (err) {
    console.error("[addEmployee]", err);
    return { ok: false, error: "Could not add. Is the database connected?" };
  }
}

export async function editEmployee(
  id: string,
  input: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = EmployeeSchema.partial().safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  try {
    await updateEmployee(id, {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      title: parsed.data.title,
      smsConsent: parsed.data.smsConsent,
    });
    revalidatePath("/admin/team/roster");
    return { ok: true };
  } catch (err) {
    console.error("[editEmployee]", err);
    return { ok: false, error: "Could not save." };
  }
}

export async function toggleEmployeeActive(
  id: string,
  active: boolean
): Promise<ActionResult> {
  await requireAdmin();
  try {
    await setEmployeeActive(id, active);
    revalidatePath("/admin/team/roster");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update." };
  }
}

export async function removeEmployee(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await deleteEmployee(id);
    revalidatePath("/admin/team/roster");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not remove." };
  }
}

/**
 * Import a CSV of staff. Header row required; columns matched by name
 * (name / email / phone / title, case-insensitive). Idempotent per email.
 */
export async function importEmployeesCsv(text: string): Promise<ActionResult> {
  await requireAdmin();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2)
    return { ok: false, error: "Add a header row and at least one person." };

  const splitRow = (line: string): string[] =>
    line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));

  const headers = splitRow(lines[0]).map((h) => h.toLowerCase());
  const col = (name: string) => headers.findIndex((h) => h === name);
  const iName = col("name");
  const iEmail = col("email");
  const iPhone = col("phone");
  const iTitle = col("title");
  if (iName === -1)
    return { ok: false, error: 'The header row needs a "name" column.' };

  let added = 0;
  let skipped = 0;
  for (const line of lines.slice(1)) {
    const cells = splitRow(line);
    const name = cells[iName]?.trim();
    if (!name) {
      skipped++;
      continue;
    }
    const email = iEmail >= 0 ? cells[iEmail]?.trim() : "";
    const phone = iPhone >= 0 ? cells[iPhone]?.trim() : "";
    if (!email && !phone) {
      skipped++;
      continue;
    }
    try {
      await upsertEmployee({
        name,
        email: email || null,
        phone: phone || null,
        title: (iTitle >= 0 ? cells[iTitle]?.trim() : "") || null,
        source: "csv",
      });
      added++;
    } catch {
      skipped++;
    }
  }
  revalidatePath("/admin/team/roster");
  return {
    ok: true,
    message: `Imported ${added} ${added === 1 ? "person" : "people"}${
      skipped ? `, skipped ${skipped}` : ""
    }.`,
  };
}

/**
 * Pull the roster from Connecteam right now (manual, ignores the cron throttle).
 * Connecteam is the source of truth, so this overwrites synced people and
 * deactivates anyone who left.
 */
export async function syncConnecteamNow(): Promise<
  { ok: true; result: SyncResult } | { ok: false; error: string }
> {
  await requireAdmin();
  if (!connecteamEnabled())
    return {
      ok: false,
      error: "Connecteam is not set up yet (CONNECTEAM_API_KEY).",
    };
  const result = await syncEmployeesFromConnecteam(new Date().toISOString());
  revalidatePath("/admin/team/roster");
  revalidatePath("/admin/team");
  if (!result.ok) return { ok: false, error: result.error ?? "The sync failed." };
  return { ok: true, result };
}

/* ---------------- surveys ---------------- */

const QuestionSchema = z.object({
  key: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(200),
  type: z.enum(["rating", "text"]),
});

const AudienceSchema = z
  .discriminatedUnion("mode", [
    z.object({ mode: z.literal("all") }),
    z.object({
      mode: z.literal("titles"),
      titles: z.array(z.string().trim().min(1).max(80)).min(1).max(50),
    }),
    z.object({
      mode: z.literal("ids"),
      ids: z.array(z.string().uuid()).min(1).max(500),
    }),
  ])
  .optional();

const SurveySchema = z.object({
  title: z.string().trim().min(1, "Give the survey a title.").max(160),
  intro: z.string().trim().max(2000).optional(),
  anonymous: z.boolean().default(true),
  audience: AudienceSchema,
  questions: z.array(QuestionSchema).min(1, "Add at least one question.").max(20),
});

export async function createSurveyAction(input: unknown): Promise<ActionResult> {
  const { email } = await requireAdmin();
  const parsed = SurveySchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  // Keys must be unique so answers map cleanly.
  const keys = new Set(parsed.data.questions.map((q) => q.key));
  if (keys.size !== parsed.data.questions.length)
    return { ok: false, error: "Question keys must be unique." };
  try {
    // "all" (or nothing) stores as null so the whole roster is targeted.
    const audience =
      !parsed.data.audience || parsed.data.audience.mode === "all"
        ? null
        : parsed.data.audience;
    const survey = await createSurvey({
      title: parsed.data.title,
      intro: parsed.data.intro,
      questions: parsed.data.questions as SurveyQuestion[],
      anonymous: parsed.data.anonymous,
      audience,
      createdBy: email,
    });
    revalidatePath("/admin/team");
    return { ok: true, id: survey.id, message: "Survey created." };
  } catch (err) {
    console.error("[createSurveyAction]", err);
    return { ok: false, error: "Could not create the survey." };
  }
}

/**
 * Send a survey to every reachable active employee. Opens the survey, creates a
 * tokenized recipient per person, and delivers by email and/or SMS. Idempotent:
 * re-sending only reaches people who have not been sent yet.
 */
export async function sendSurveyToTeam(surveyId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const survey = await getSurveyById(surveyId);
    if (!survey) return { ok: false, error: "Survey not found." };
    if (survey.status === "closed")
      return { ok: false, error: "This survey is closed." };

    const canEmail = emailEnabled();
    const canSms = smsEnabled();
    if (!canEmail && !canSms)
      return {
        ok: false,
        error: "Neither email nor SMS is set up yet (see OPERATIONS.md).",
      };

    const employees = (await listReachableEmployees()).filter((e) =>
      employeeInAudience(e, survey.audience)
    );
    if (employees.length === 0)
      return {
        ok: false,
        error: "No active employees match this survey's audience yet.",
      };

    // Move to open so the links work.
    if (survey.status !== "open") await setSurveyStatus(surveyId, "open");

    let sent = 0;
    for (const emp of employees) {
      const wantEmail = canEmail && !!emp.email;
      const wantSms = canSms && !!emp.phone && emp.sms_consent;
      if (!wantEmail && !wantSms) continue;
      const channel: SurveyChannel =
        wantEmail && wantSms ? "both" : wantEmail ? "email" : "sms";

      const recipient = await ensureRecipient(surveyId, emp.id, channel);
      if (recipient.sent_at) continue; // already invited on a prior send

      let delivered = false;
      if (wantEmail) {
        const ok = await sendEmployeeSurveyInvitation({
          name: emp.name,
          email: emp.email,
          token: recipient.token,
          surveyTitle: survey.title,
          anonymous: survey.anonymous,
        });
        delivered = delivered || ok;
      }
      if (wantSms && emp.phone) {
        const to = toE164(emp.phone);
        if (to) {
          const url = `${SITE_URL}/pulse/${recipient.token}`;
          const first = emp.name.trim().split(/\s+/)[0] || "there";
          const res = await sendSms(
            to,
            `Hi ${first}, it's Joy Senior Living. A quick team check-in (about 2 minutes${
              survey.anonymous ? ", anonymous" : ""
            }): ${url}\n\nReply STOP to opt out.`
          );
          delivered = delivered || res.ok;
        }
      }
      if (delivered) {
        await markRecipientSent(recipient.id);
        sent++;
      }
    }

    revalidatePath("/admin/team");
    revalidatePath(`/admin/team/${surveyId}`);
    if (sent === 0)
      return {
        ok: true,
        message: "Everyone reachable has already been invited.",
      };
    return { ok: true, message: `Sent to ${sent} ${sent === 1 ? "person" : "people"}.` };
  } catch (err) {
    console.error("[sendSurveyToTeam]", err);
    return { ok: false, error: "Could not send the survey." };
  }
}

export async function setSurveyStatusAction(
  surveyId: string,
  status: "open" | "closed"
): Promise<ActionResult> {
  await requireAdmin();
  try {
    await setSurveyStatus(surveyId, status);
    revalidatePath("/admin/team");
    revalidatePath(`/admin/team/${surveyId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update the survey." };
  }
}

export async function setAutoEnrollAction(
  surveyId: string,
  autoEnroll: boolean
): Promise<ActionResult> {
  await requireAdmin();
  try {
    await setSurveyAutoEnroll(surveyId, autoEnroll);
    revalidatePath("/admin/team");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update automation." };
  }
}

export async function deleteSurveyAction(surveyId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await deleteSurvey(surveyId);
    revalidatePath("/admin/team");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete the survey." };
  }
}
