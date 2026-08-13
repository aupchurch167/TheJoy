"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import {
  createFeedbackRequest,
  markRequestSent,
  getRequestById,
  setCallbackStatus,
  getRecentlyContacted,
  SURVEY_MIN_INTERVAL_DAYS,
  type SurveyChannel,
} from "@/lib/feedback";
import { getSubscribedByAudience, getSmsRecipients, type Lead } from "@/lib/leads";
import { sendSurveyInvitation, emailEnabled } from "@/lib/email";
import { smsEnabled, sendSurveyText, toE164 } from "@/lib/sms";
import { SITE_URL } from "@/lib/site";

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

/** A family we might contact, merged across the email- and SMS-eligible lists. */
type Candidate = {
  name: string;
  residentName: string | null;
  email: string | null;
  phone: string | null; // E.164, when a valid number is on file
};

/**
 * Send the survey to family contacts across the chosen channels (email and/or
 * text). Enforces the cadence: no contact is invited again within
 * SURVEY_MIN_INTERVAL_DAYS, by email OR by phone, so re-running this only reaches
 * families who are due. One tokenized request per family (a single request can
 * be delivered by both channels at once). Anyone due only for a channel that is
 * turned off (or unconfigured) is skipped.
 */
export async function sendSurveyToAllFamilies(input?: {
  channels?: SurveyChannel;
}): Promise<FeedbackActionResult> {
  const { email } = await requireAdmin();
  const want = input?.channels ?? "email";
  const wantEmail = want === "email" || want === "both";
  const wantSms = want === "sms" || want === "both";

  const canEmail = wantEmail && emailEnabled();
  const canSms = wantSms && smsEnabled();
  if (!canEmail && !canSms) {
    if (wantSms && !smsEnabled())
      return {
        ok: false,
        error: "Text is not configured yet (QUO_API_KEY and QUO_FROM_NUMBER).",
      };
    return {
      ok: false,
      error: "Email is not configured yet (RESEND_API_KEY). Add it first.",
    };
  }

  try {
    const [emailFamilies, smsFamilies, recent] = await Promise.all([
      canEmail ? getSubscribedByAudience("families") : Promise.resolve([] as Lead[]),
      canSms ? getSmsRecipients() : Promise.resolve([] as Lead[]),
      getRecentlyContacted(SURVEY_MIN_INTERVAL_DAYS),
    ]);

    // Merge both eligible lists into one candidate per family (keyed by lead id).
    const byId = new Map<string, Candidate>();
    for (const c of emailFamilies) {
      byId.set(c.id, {
        name: c.name,
        residentName: c.resident_name,
        email: (c.email ?? "").trim().toLowerCase() || null,
        phone: null,
      });
    }
    for (const c of smsFamilies) {
      const e164 = toE164(c.phone);
      if (!e164) continue;
      const existing = byId.get(c.id);
      if (existing) existing.phone = e164;
      else
        byId.set(c.id, {
          name: c.name,
          residentName: c.resident_name,
          email: (c.email ?? "").trim().toLowerCase() || null,
          phone: e164,
        });
    }

    const url = (token: string) => `${SITE_URL}/feedback/${token}`;
    let emailed = 0;
    let texted = 0;
    let skipped = 0;

    for (const c of byId.values()) {
      // Decide the channels for this family: eligible, requested, and not
      // already contacted on that channel inside the guardrail window.
      const sendEmail = canEmail && !!c.email && !recent.emails.has(c.email);
      const sendSmsTo = canSms && !!c.phone && !recent.phones.has(c.phone);
      if (!sendEmail && !sendSmsTo) {
        skipped++;
        continue;
      }

      const channel: SurveyChannel =
        sendEmail && sendSmsTo ? "both" : sendEmail ? "email" : "sms";
      const request = await createFeedbackRequest({
        familyName: c.name,
        familyEmail: sendEmail ? c.email : null,
        familyPhone: sendSmsTo ? c.phone : null,
        channel,
        residentFirstName: firstName(c.residentName),
        createdBy: email,
      });

      let delivered = false;
      if (sendEmail && c.email) {
        const ok = await sendSurveyInvitation({
          family_name: c.name,
          family_email: c.email,
          resident_first_name: firstName(c.residentName),
          token: request.token,
        });
        if (ok) {
          delivered = true;
          emailed++;
          recent.emails.add(c.email); // guard against dupes within this run
        }
      }
      if (sendSmsTo && c.phone) {
        const res = await sendSurveyText({
          toPhone: c.phone,
          familyName: c.name,
          residentFirstName: firstName(c.residentName),
          url: url(request.token),
        });
        if (res.ok) {
          delivered = true;
          texted++;
          recent.phones.add(c.phone);
        }
      }
      if (delivered) await markRequestSent(request.id);
    }

    revalidatePath("/admin/feedback");

    const totalSent = emailed + texted;
    if (totalSent === 0) {
      return {
        ok: true,
        message: skipped
          ? `No new surveys sent. ${skipped} family member(s) were surveyed within the last ${SURVEY_MIN_INTERVAL_DAYS} days.`
          : "No eligible family members were found for the chosen channel.",
      };
    }
    const parts: string[] = [];
    if (emailed) parts.push(`${emailed} email${emailed === 1 ? "" : "s"}`);
    if (texted) parts.push(`${texted} text${texted === 1 ? "" : "s"}`);
    return {
      ok: true,
      message: `Sent ${parts.join(" and ")}${
        skipped ? `, skipped ${skipped} surveyed in the last ${SURVEY_MIN_INTERVAL_DAYS} days` : ""
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

    // Re-send on whatever channel(s) this request was created for.
    const targets: string[] = [];
    if (request.family_email && emailEnabled()) {
      const ok = await sendSurveyInvitation(request);
      if (ok) targets.push(request.family_email);
    }
    if (request.family_phone && smsEnabled()) {
      const res = await sendSurveyText({
        toPhone: request.family_phone,
        familyName: request.family_name,
        residentFirstName: request.resident_first_name,
        url: `${SITE_URL}/feedback/${request.token}`,
      });
      if (res.ok) targets.push(request.family_phone);
    }

    if (!targets.length) {
      const needsCfg =
        (request.family_email && !emailEnabled()) ||
        (request.family_phone && !smsEnabled());
      return {
        ok: false,
        error: needsCfg
          ? "That channel is not configured yet. Add its keys and try again."
          : "Could not re-send. Please try again.",
      };
    }
    await markRequestSent(request.id);
    revalidatePath("/admin/feedback");
    return { ok: true, message: `Survey re-sent to ${targets.join(" and ")}.` };
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
