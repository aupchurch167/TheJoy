"use server";

import { z } from "zod";
import { getByToken, submitResponse } from "@/lib/employee-feedback";

const SubmitSchema = z.object({
  token: z.string().trim().min(10).max(120),
  // question_key -> value (rating number or free text)
  answers: z.record(z.string(), z.union([z.number(), z.string()])).default({}),
  comment: z.string().trim().max(4000).optional(),
});

export type PulseResult = { ok: true } | { ok: false; error: string };

export async function submitPulse(input: unknown): Promise<PulseResult> {
  const parsed = SubmitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check your answers." };

  try {
    const ctx = await getByToken(parsed.data.token);
    if (!ctx) return { ok: false, error: "This link is no longer active." };
    if (ctx.recipient.completed_at)
      return { ok: false, error: "This check-in has already been submitted." };
    if (ctx.survey.status !== "open")
      return { ok: false, error: "This check-in is closed." };

    // Keep only answers to questions the survey actually defines; coerce ratings.
    const answers: Record<string, unknown> = {};
    for (const q of ctx.survey.questions) {
      const v = parsed.data.answers[q.key];
      if (v === undefined || v === "") continue;
      if (q.type === "rating") {
        const n = Number(v);
        if (Number.isFinite(n) && n >= 1 && n <= 5) answers[q.key] = n;
      } else {
        answers[q.key] = String(v).slice(0, 4000);
      }
    }

    await submitResponse({
      survey: ctx.survey,
      recipient: ctx.recipient,
      answers,
      comment: parsed.data.comment ?? null,
    });
    return { ok: true };
  } catch (err) {
    console.error("[submitPulse]", err);
    return { ok: false, error: "Could not submit. Please try again." };
  }
}
