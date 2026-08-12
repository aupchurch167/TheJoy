"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import {
  createFeedbackRequest,
  markRequestSent,
  getRequestById,
  setCallbackStatus,
} from "@/lib/feedback";
import { sendSurveyInvitation, emailEnabled } from "@/lib/email";

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
