import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import {
  getFeedbackSummary,
  listReadableResponses,
  getFeedbackTrend,
  type FeedbackRange,
} from "@/lib/feedback";
import { aiEnabled } from "@/lib/ai";
import { formatDate } from "@/lib/format";
import { BUSINESS } from "@/lib/site";
import FeedbackSummary from "../FeedbackSummary";
import PrintButton from "./PrintButton";
import ReportRange from "./ReportRange";
import FeedbackTrend from "./FeedbackTrend";
import AiSummary from "./AiSummary";
import { PageHeader, BackLink, Card, NotConnected } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const RECOMMEND: Record<string, string> = {
  definitely: "Definitely",
  probably: "Probably",
  not_sure: "Not sure",
  no: "No",
};

type ResolvedRange = FeedbackRange & {
  preset: string;
  label: string;
  fromInput: string; // yyyy-mm-dd for the date input
  toInput: string;
};

/** Turn the query params into a concrete window + human label. */
function resolveRange(sp: {
  preset?: string;
  from?: string;
  to?: string;
}): ResolvedRange {
  const preset = sp.preset ?? "all";
  const now = new Date();
  const ms = now.getTime();
  const day = 24 * 60 * 60 * 1000;
  const iso = (t: number) => new Date(t).toISOString();

  if (preset === "30")
    return { preset, label: "Last 30 days", from: iso(ms - 30 * day), to: null, fromInput: "", toInput: "" };
  if (preset === "90")
    return { preset, label: "Last 90 days", from: iso(ms - 90 * day), to: null, fromInput: "", toInput: "" };
  if (preset === "365")
    return { preset, label: "Last 12 months", from: iso(ms - 365 * day), to: null, fromInput: "", toInput: "" };
  if (preset === "ytd")
    return {
      preset,
      label: `${now.getFullYear()} to date`,
      from: new Date(now.getFullYear(), 0, 1).toISOString(),
      to: null,
      fromInput: "",
      toInput: "",
    };
  if (preset === "custom") {
    const from = sp.from ? new Date(`${sp.from}T00:00:00`).toISOString() : null;
    const to = sp.to ? new Date(`${sp.to}T23:59:59`).toISOString() : null;
    const label =
      sp.from || sp.to
        ? `${sp.from ? formatDate(sp.from) : "start"} to ${sp.to ? formatDate(sp.to) : "now"}`
        : "Custom period";
    return { preset, label, from, to, fromInput: sp.from ?? "", toInput: sp.to ?? "" };
  }
  return { preset: "all", label: "All time", from: null, to: null, fromInput: "", toInput: "" };
}

export default async function FeedbackReportPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Feedback report" />
        <NotConnected what="The feedback report" />
      </>
    );
  }

  const range = resolveRange(await searchParams);

  const [summary, responses, trend] = await Promise.all([
    getFeedbackSummary(range),
    listReadableResponses(range),
    getFeedbackTrend(12),
  ]);

  const generated = formatDate(new Date());

  const nameOf = (r: { family_name: string | null; is_anonymous: boolean }) =>
    r.is_anonymous || !r.family_name ? "Anonymous" : r.family_name;

  const highlights = responses
    .filter((r) => r.sentiment === "positive" && r.going_well)
    .slice(0, 6);
  const concerns = responses
    .filter((r) => r.sentiment === "concern")
    .slice(0, 10);

  return (
    <div className="max-w-3xl">
      <div className="mb-4 print:hidden">
        <BackLink href="/admin/feedback">Back to feedback</BackLink>
      </div>

      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Family Feedback Report
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {BUSINESS.name}, a personal care home. Generated {generated}. Period:{" "}
            <span className="font-medium text-ink">{range.label}</span>.
          </p>
        </div>
        <div className="print:hidden">
          <PrintButton />
        </div>
      </div>

      <div className="mb-6">
        <ReportRange
          preset={range.preset}
          from={range.fromInput}
          to={range.toInput}
        />
      </div>

      <FeedbackSummary summary={summary} />

      <AiSummary
        from={range.from ?? null}
        to={range.to ?? null}
        label={range.label}
        aiEnabled={aiEnabled()}
      />

      <FeedbackTrend points={trend} />

      {/* What families are saying */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-ink">
          What families are saying
        </h2>
        {highlights.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faint">
            No written comments yet. They appear here as families respond.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {highlights.map((r) => (
              <Card key={r.id} className="break-inside-avoid">
                <p className="text-[15px] leading-relaxed text-ink">
                  “{r.going_well}”
                </p>
                <p className="mt-2 text-xs text-ink-faint">
                  {nameOf(r)} · {"♥".repeat(r.overall_rating)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Concerns and how we are following up */}
      {concerns.length > 0 && (
        <section className="mt-8 break-inside-avoid">
          <h2 className="font-display text-xl font-semibold text-ink">
            Concerns we are following up on
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Every concern is routed to Mellissa for a personal call.
          </p>
          <ul className="mt-3 space-y-2">
            {concerns.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-line bg-white p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-ink">{nameOf(r)}</span>
                  <span className="text-xs text-ink-faint">
                    {r.overall_rating} of 5
                    {r.would_recommend
                      ? ` · ${RECOMMEND[r.would_recommend]}`
                      : ""}
                  </span>
                </div>
                {r.could_be_better && (
                  <p className="mt-1 whitespace-pre-wrap text-ink-soft">
                    {r.could_be_better}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 border-t border-line pt-4 text-xs text-ink-faint">
        Prepared for the {BUSINESS.name} team. Individual responses may be omitted
        where a family chose to answer anonymously.
      </p>
    </div>
  );
}
