import { Card, StatCard, SectionLabel, ButtonLink } from "@/components/admin/ui";
import type { FeedbackSummary as Summary } from "@/lib/feedback";

const DIMENSIONS: { key: keyof Summary["dimensions"]; label: string }[] = [
  { key: "care", label: "Care" },
  { key: "communication", label: "Communication" },
  { key: "dining", label: "Meals and dining" },
  { key: "home_feel", label: "Feels like home" },
  { key: "engagement", label: "Activities" },
];

const RECOMMEND: { key: keyof Summary["recommend"]; label: string }[] = [
  { key: "definitely", label: "Definitely" },
  { key: "probably", label: "Probably" },
  { key: "not_sure", label: "Not sure" },
  { key: "no", label: "No" },
];

function pct(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

/** Label for a 1..3 dimension average. */
function dimWord(v: number): string {
  if (v >= 2.5) return "Great";
  if (v >= 1.75) return "Okay";
  return "Needs work";
}

export default function FeedbackSummary({
  summary,
  reportHref,
}: {
  summary: Summary;
  /** When set, shows a prominent link to the full shareable report. */
  reportHref?: string;
}) {
  const {
    sent,
    completed,
    responseRate,
    responses,
    anonymous,
    avgOverall,
    positive,
    concern,
    openCallbacks,
    dimensions,
    recommend,
  } = summary;

  const recTotal =
    recommend.definitely + recommend.probably + recommend.not_sure + recommend.no;

  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel>At a glance</SectionLabel>
        {reportHref && (
          <ButtonLink href={reportHref} variant="secondary" size="sm">
            View full report and trends →
          </ButtonLink>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Surveys sent"
          value={sent}
          hint={anonymous > 0 ? `${anonymous} answered anonymously` : undefined}
        />
        <StatCard
          label="Responses"
          value={completed}
          hint={
            responseRate != null
              ? `${Math.round(responseRate * 100)}% response rate`
              : "No sends yet"
          }
          tone="info"
        />
        <StatCard
          label="Average rating"
          value={avgOverall != null ? `${avgOverall.toFixed(1)}` : "—"}
          hint={
            avgOverall != null
              ? `${"♥".repeat(Math.round(avgOverall))}${"♡".repeat(5 - Math.round(avgOverall))} of 5`
              : "No responses yet"
          }
          tone="success"
        />
        <StatCard
          label="Concerns"
          value={concern}
          hint={
            openCallbacks > 0
              ? `${openCallbacks} open callback${openCallbacks === 1 ? "" : "s"}`
              : positive > 0
                ? `${positive} positive`
                : undefined
          }
          tone={concern > 0 ? "danger" : "neutral"}
        />
      </div>

      {responses === 0 && (
        <p className="mt-3 text-sm text-ink-faint">
          No responses yet. These numbers fill in as families complete the
          survey. The dimension and recommend breakdowns appear once you have a
          first response.
        </p>
      )}

      {responses > 0 && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Dimension averages */}
          <Card>
            <SectionLabel>What families rate highest</SectionLabel>
            <ul className="mt-3 space-y-3">
              {DIMENSIONS.map(({ key, label }) => {
                const v = dimensions[key];
                const width = v != null ? ((v - 1) / 2) * 100 : 0;
                return (
                  <li key={key}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-ink-soft">{label}</span>
                      <span
                        className={
                          v == null
                            ? "text-ink-faint"
                            : v < 1.75
                              ? "font-medium text-danger"
                              : "text-ink"
                        }
                      >
                        {v != null ? `${dimWord(v)} (${v.toFixed(1)}/3)` : "Not rated"}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface">
                      <div
                        className={`h-full rounded-full ${v != null && v < 1.75 ? "bg-danger" : "bg-clay"}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Would-recommend breakdown */}
          <Card>
            <SectionLabel>Would recommend Joy</SectionLabel>
            {recTotal === 0 ? (
              <p className="mt-3 text-sm text-ink-faint">
                No recommend answers yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {RECOMMEND.map(({ key, label }) => {
                  const n = recommend[key];
                  const p = pct(n, recTotal);
                  const soft = key === "not_sure" || key === "no";
                  return (
                    <li key={key}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-ink-soft">{label}</span>
                        <span className="text-ink">
                          {n} ({p}%)
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface">
                        <div
                          className={`h-full rounded-full ${soft ? "bg-gold" : "bg-sage"}`}
                          style={{ width: `${p}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      )}
    </section>
  );
}
