import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getFeedbackSummary, listFeedbackRequests } from "@/lib/feedback";
import { formatDate } from "@/lib/format";
import { BUSINESS } from "@/lib/site";
import FeedbackSummary from "../FeedbackSummary";
import PrintButton from "./PrintButton";
import { PageHeader, BackLink, Card, NotConnected } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const RECOMMEND: Record<string, string> = {
  definitely: "Definitely",
  probably: "Probably",
  not_sure: "Not sure",
  no: "No",
};

export default async function FeedbackReportPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Feedback report" />
        <NotConnected what="The feedback report" />
      </>
    );
  }

  const [summary, requests] = await Promise.all([
    getFeedbackSummary(),
    listFeedbackRequests(),
  ]);

  const generated = formatDate(new Date());

  const completed = requests.filter((r) => r.rating != null);
  const highlights = completed
    .filter((r) => r.sentiment === "positive" && r.going_well)
    .slice(0, 6);
  const concerns = completed
    .filter((r) => r.sentiment === "concern")
    .slice(0, 10);

  return (
    <div className="max-w-3xl">
      <div className="mb-4 print:hidden">
        <BackLink href="/admin/feedback">Back to feedback</BackLink>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Family Feedback Report
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {BUSINESS.name}, a personal care home. Generated {generated}. All
            responses to date.
          </p>
        </div>
        <div className="print:hidden">
          <PrintButton />
        </div>
      </div>

      <FeedbackSummary summary={summary} />

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
                  {r.family_name}
                  {r.rating != null ? ` · ${"♥".repeat(r.rating)}` : ""}
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
                  <span className="font-medium text-ink">{r.family_name}</span>
                  <span className="text-xs text-ink-faint">
                    {r.rating != null ? `${r.rating} of 5` : ""}
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
