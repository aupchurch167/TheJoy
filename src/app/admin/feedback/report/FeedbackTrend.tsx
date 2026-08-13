import { Card } from "@/components/admin/ui";
import type { FeedbackTrendPoint } from "@/lib/feedback";

/** Month label from 'YYYY-MM' (e.g. "Aug 2026"). */
function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const name = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][(m || 1) - 1];
  return `${name} ${y}`;
}

/**
 * How feedback changed month over month: response volume and average rating,
 * as simple bars. Rating bar is scaled to 5; the number is shown alongside.
 */
export default function FeedbackTrend({
  points,
}: {
  points: FeedbackTrendPoint[];
}) {
  if (points.length < 2) return null; // need at least two months to show a trend

  const maxCount = Math.max(...points.map((p) => p.responses), 1);

  return (
    <section className="mt-8 break-inside-avoid">
      <h2 className="font-display text-xl font-semibold text-ink">
        How it is trending
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        Responses and average rating by month.
      </p>

      <Card className="mt-3">
        <ul className="space-y-3">
          {points.map((p) => {
            const ratingPct = p.avgOverall != null ? (p.avgOverall / 5) * 100 : 0;
            const countPct = (p.responses / maxCount) * 100;
            return (
              <li key={p.month} className="grid grid-cols-[4.5rem_1fr] items-center gap-3">
                <span className="text-xs font-medium text-ink-soft">
                  {monthLabel(p.month)}
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-clay"
                        style={{ width: `${ratingPct}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-xs text-ink-faint">
                      {p.avgOverall != null ? `${p.avgOverall.toFixed(1)} of 5` : "no rating"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-sage"
                        style={{ width: `${countPct}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-xs text-ink-faint">
                      {p.responses} response{p.responses === 1 ? "" : "s"}
                      {p.concern > 0 ? `, ${p.concern} concern` : ""}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex gap-4 text-xs text-ink-faint">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-full bg-clay" /> Average rating
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-full bg-sage" /> Responses
          </span>
        </div>
      </Card>
    </section>
  );
}
