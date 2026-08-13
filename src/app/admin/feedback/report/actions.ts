"use server";

import { requireAdmin } from "@/lib/require-admin";
import {
  getFeedbackSummary,
  listReadableResponses,
  type FeedbackRange,
} from "@/lib/feedback";
import { summarizeFeedback, aiEnabled, type FeedbackDigest } from "@/lib/ai";

const RECOMMEND: Record<string, string> = {
  definitely: "Definitely",
  probably: "Probably",
  not_sure: "Not sure",
  no: "No",
};

export type SummaryResult =
  | { ok: true; digest: FeedbackDigest }
  | { ok: false; error: string };

/**
 * Summarize the written feedback in a period with Claude. Grounded in the
 * responses on file (never fabricated), so the report can carry a plain-English
 * read of what families are saying.
 */
export async function summarizeFeedbackReport(
  range: FeedbackRange & { label?: string }
): Promise<SummaryResult> {
  await requireAdmin();
  if (!aiEnabled()) {
    return {
      ok: false,
      error: "AI is not configured yet (set ANTHROPIC_API_KEY).",
    };
  }
  try {
    const [summary, responses] = await Promise.all([
      getFeedbackSummary(range),
      listReadableResponses(range),
    ]);
    if (responses.length === 0) {
      return { ok: false, error: "No responses in this period to summarize." };
    }
    const digest = await summarizeFeedback({
      period: range.label || "the selected period",
      count: summary.responses,
      avgOverall: summary.avgOverall,
      positive: summary.positive,
      concern: summary.concern,
      comments: responses.map((r) => ({
        rating: r.overall_rating,
        recommend: r.would_recommend ? RECOMMEND[r.would_recommend] : null,
        goingWell: r.going_well,
        couldBeBetter: r.could_be_better,
        suggestions: r.suggestions,
        anonymous: r.is_anonymous,
      })),
    });
    return { ok: true, digest };
  } catch (err) {
    console.error("[summarizeFeedbackReport]", err);
    return { ok: false, error: "Could not generate the summary. Please try again." };
  }
}
