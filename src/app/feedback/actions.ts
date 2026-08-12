"use server";

import { z } from "zod";
import {
  getRequestByToken,
  submitResponse,
  createCallbackRequest,
  getResponseById,
  getRequestById,
  type Sentiment,
} from "@/lib/feedback";
import { getSettings } from "@/lib/settings";
import { sendConcernAlert } from "@/lib/email";

/**
 * Public, token-gated feedback actions. No admin auth: a valid, not-yet-used
 * survey token is the gate. Anonymity is honored end to end.
 */

const SubmitSchema = z.object({
  token: z.string().min(10).max(200),
  rating: z.number().int().min(1).max(5),
  goingWell: z.string().max(4000).optional(),
  couldBeBetter: z.string().max(4000).optional(),
  suggestions: z.string().max(4000).optional(),
  anonymous: z.boolean().optional(),
});

export type SubmitResult =
  | { ok: true; responseId: string; sentiment: Sentiment; rating: number }
  | { ok: false; error: string };

function alertRecipients(csv: string): string[] {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function submitFeedback(input: unknown): Promise<SubmitResult> {
  const parsed = SubmitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check your answers." };

  try {
    const request = await getRequestByToken(parsed.data.token);
    if (!request || request.completed_at) {
      return { ok: false, error: "This survey link is no longer active." };
    }

    const anonymous = parsed.data.anonymous === true;
    const response = await submitResponse({
      request,
      rating: parsed.data.rating,
      goingWell: parsed.data.goingWell,
      couldBeBetter: parsed.data.couldBeBetter,
      suggestions: parsed.data.suggestions,
      anonymous,
    });

    // Concern (rating <= 3): alert the team immediately, callback or not.
    if (response.sentiment === "concern") {
      const settings = await getSettings();
      await sendConcernAlert({
        to: alertRecipients(settings.feedback_alert_emails),
        familyLabel: anonymous ? "Anonymous" : request.family_name,
        rating: response.overall_rating,
        goingWell: response.going_well,
        couldBeBetter: response.could_be_better,
        suggestions: response.suggestions,
      });
    }

    return {
      ok: true,
      responseId: response.id,
      sentiment: response.sentiment,
      rating: response.overall_rating,
    };
  } catch (err) {
    console.error("[submitFeedback]", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

const CallbackSchema = z.object({
  responseId: z.string().uuid(),
  name: z.string().trim().min(1, "Please add a name.").max(120),
  phone: z.string().trim().min(7, "Please add a phone number.").max(40),
  preferredTime: z.string().trim().max(200).optional(),
});

export type CallbackResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitCallback(input: unknown): Promise<CallbackResult> {
  const parsed = CallbackSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };

  try {
    const response = await getResponseById(parsed.data.responseId);
    if (!response) return { ok: false, error: "That request has expired." };

    await createCallbackRequest({
      responseId: response.id,
      contactName: parsed.data.name,
      contactPhone: parsed.data.phone,
      preferredTime: parsed.data.preferredTime,
    });

    // Alert the team with the callback details (fires even if a low-rating
    // alert already went out). The family shared this contact info willingly,
    // so it is included even when the survey response is anonymous.
    const settings = await getSettings();
    // If the response is linked, we can name the family; otherwise use the
    // contact name they just provided.
    let familyLabel = parsed.data.name;
    if (response.request_id) {
      const req = await getRequestById(response.request_id);
      if (req) familyLabel = req.family_name;
    }
    await sendConcernAlert({
      to: alertRecipients(settings.feedback_alert_emails),
      familyLabel,
      rating: response.overall_rating,
      goingWell: response.going_well,
      couldBeBetter: response.could_be_better,
      suggestions: response.suggestions,
      callback: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        preferredTime: parsed.data.preferredTime,
      },
    });

    return { ok: true };
  } catch (err) {
    console.error("[submitCallback]", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
