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

const Dim = z.number().int().min(1).max(3).nullable().optional();
const SubmitSchema = z.object({
  token: z.string().min(10).max(200),
  rating: z.number().int().min(1).max(5),
  dimensions: z
    .object({
      care: Dim,
      communication: Dim,
      dining: Dim,
      home_feel: Dim,
      engagement: Dim,
    })
    .optional(),
  recommend: z
    .enum(["definitely", "probably", "not_sure", "no"])
    .nullable()
    .optional(),
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

const DIM_LABEL: Record<string, string> = {
  care: "Care",
  communication: "Communication",
  dining: "Meals and dining",
  home_feel: "Feels like home",
  engagement: "Activities",
};
const DIM_VALUE: Record<number, string> = { 1: "Needs work", 2: "Okay", 3: "Great" };
const RECOMMEND_LABEL: Record<string, string> = {
  definitely: "Definitely",
  probably: "Probably",
  not_sure: "Not sure",
  no: "No",
};

/** Turn a response's dimension columns into labeled rows for the alert email. */
function dimensionRows(resp: {
  rating_care: number | null;
  rating_communication: number | null;
  rating_dining: number | null;
  rating_home_feel: number | null;
  rating_engagement: number | null;
}): { label: string; value: string }[] {
  const map: [string, number | null][] = [
    ["care", resp.rating_care],
    ["communication", resp.rating_communication],
    ["dining", resp.rating_dining],
    ["home_feel", resp.rating_home_feel],
    ["engagement", resp.rating_engagement],
  ];
  return map
    .filter(([, v]) => v != null)
    .map(([k, v]) => ({ label: DIM_LABEL[k], value: DIM_VALUE[v as number] }));
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
    const d = parsed.data.dimensions ?? {};
    const response = await submitResponse({
      request,
      rating: parsed.data.rating,
      dimensions: {
        care: d.care ?? null,
        communication: d.communication ?? null,
        dining: d.dining ?? null,
        home_feel: d.home_feel ?? null,
        engagement: d.engagement ?? null,
      },
      recommend: parsed.data.recommend ?? null,
      goingWell: parsed.data.goingWell,
      couldBeBetter: parsed.data.couldBeBetter,
      suggestions: parsed.data.suggestions,
      anonymous,
    });

    // Concern sentiment: alert the team immediately, callback or not.
    if (response.sentiment === "concern") {
      const settings = await getSettings();
      await sendConcernAlert({
        to: alertRecipients(settings.feedback_alert_emails),
        familyLabel: anonymous ? "Anonymous" : request.family_name,
        rating: response.overall_rating,
        dimensions: dimensionRows(response),
        recommend: response.would_recommend
          ? RECOMMEND_LABEL[response.would_recommend]
          : null,
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
      dimensions: dimensionRows(response),
      recommend: response.would_recommend
        ? RECOMMEND_LABEL[response.would_recommend]
        : null,
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
