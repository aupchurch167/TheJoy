"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import {
  createFeedbackRequest,
  markRequestSent,
  getRequestById,
  setCallbackStatus,
  getOpenRequestEmails,
} from "@/lib/feedback";
import { getSubscribedByAudience } from "@/lib/leads";
import { sendSurveyInvitation, emailEnabled } from "@/lib/email";

/** First name from a resident's full name, for email personalization. */
function firstName(full: string | null): string | null {
  const f = (full ?? "").trim().split(/\s+/)[0];
  return f || null;
}

export type FeedbackActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const SendSchema = z.object({
  familyName: z.string().trim().min(1, "Family name is required.").max(120),
  familyEmail: z.string().trim().email("Enter a valid email."),
  residentFirstName: z.string().trim().max(80).optional(),
});

export async function sendSurvey(input: unknown): Promise<FeedbackActionResult> {
  const { email } = await requireAdmin();
  const parsed = SendSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };

  try {
    const request = await createFeedbackRequest({
      familyName: parsed.data.familyName,
      familyEmail: parsed.data.familyEmail,
      residentFirstName: parsed.data.residentFirstName,
      createdBy: email,
    });

    if (!emailEnabled()) {
      revalidatePath("/admin/feedback");
      return {
        ok: true,
        message:
          "Survey created, but email is not configured yet, so it was not sent. Set RESEND_API_KEY, then use Re-send.",
      };
    }

    const sent = await sendSurveyInvitation(request);
    if (sent) await markRequestSent(request.id);
    revalidatePath("/admin/feedback");
    return {
      ok: true,
      message: sent
        ? `Survey sent to ${request.family_email}.`
        : "Survey created but could not be emailed. Try Re-send.",
    };
  } catch (err) {
    console.error("[sendSurvey]", err);
    return { ok: false, error: "Could not send the survey. Is the database connected?" };
  }
}

/**
 * Send the survey to every active family contact with an email, skipping anyone
 * who already has an outstanding (not-yet-completed) survey so no one is
 * double-invited. One tokenized request per contact.
 */
export async function sendSurveyToAllFamilies(): Promise<FeedbackActionResult> {
  const { email } = await requireAdmin();
  if (!emailEnabled()) {
    return {
      ok: false,
      error: "Email is not configured yet (RESEND_API_KEY). Add it first.",
    };
  }
  try {
    const [families, openEmails] = await Promise.all([
      getSubscribedByAudience("families"),
      getOpenRequestEmails(),
    ]);

    let sent = 0;
    let skipped = 0;
    for (const contact of families) {
      const to = (contact.email ?? "").trim().toLowerCase();
      if (!to || openEmails.has(to)) {
        skipped++;
        continue;
      }
      const request = await createFeedbackRequest({
        familyName: contact.name,
        familyEmail: to,
        residentFirstName: firstName(contact.resident_name),
        createdBy: email,
      });
      const ok = await sendSurveyInvitation(request);
      if (ok) await markRequestSent(request.id);
      sent++;
      openEmails.add(to); // guard against duplicate contacts in the list
    }

    revalidatePath("/admin/feedback");
    if (sent === 0) {
      return {
        ok: true,
        message: skipped
          ? `No new surveys sent. ${skipped} family member(s) already have an open survey.`
          : "No active family members with an email were found.",
      };
    }
    return {
      ok: true,
      message: `Sent ${sent} survey${sent === 1 ? "" : "s"}${
        skipped ? `, skipped ${skipped} who already have an open one` : ""
      }.`,
    };
  } catch (err) {
    console.error("[sendSurveyToAllFamilies]", err);
    return { ok: false, error: "Could not send. Is the database connected?" };
  }
}

export async function resendSurvey(id: string): Promise<FeedbackActionResult> {
  await requireAdmin();
  try {
    const request = await getRequestById(id);
    if (!request) return { ok: false, error: "Request not found." };
    if (request.completed_at)
      return { ok: false, error: "This family already completed the survey." };
    if (!emailEnabled())
      return { ok: false, error: "Email is not configured (RESEND_API_KEY)." };

    const sent = await sendSurveyInvitation(request);
    if (!sent) return { ok: false, error: "Could not send the email." };
    await markRequestSent(request.id);
    revalidatePath("/admin/feedback");
    return { ok: true, message: `Survey re-sent to ${request.family_email}.` };
  } catch (err) {
    console.error("[resendSurvey]", err);
    return { ok: false, error: "Could not re-send." };
  }
}

const StatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "contacted", "resolved"]),
});

export async function updateCallbackStatus(
  input: unknown
): Promise<{ ok: boolean }> {
  await requireAdmin();
  const parsed = StatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  try {
    await setCallbackStatus(parsed.data.id, parsed.data.status);
    revalidatePath("/admin/feedback");
    return { ok: true };
  } catch (err) {
    console.error("[updateCallbackStatus]", err);
    return { ok: false };
  }
}
