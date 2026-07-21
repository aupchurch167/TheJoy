import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getKeywordTrends, rankLoggingEnabled } from "@/lib/ranks";

export const dynamic = "force-dynamic";

function trendArrow(history: { position: number | null }[]): string {
  const pts = history.filter((h) => h.position != null).map((h) => h.position!);
  if (pts.length < 2) return "";
  const delta = pts[pts.length - 1] - pts[0];
  // Lower position number is better.
  if (delta < 0) return "▲ up";
  if (delta > 0) return "▼ down";
  return "";
}

export default async function SeoPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-display text-2xl font-semibold text-ink">
          SEO ranks
        </h1>
        <p className="mt-4 rounded-lg bg-clay/10 px-4 py-3 text-clay-dark">
          The database is not connected yet.
        </p>
      </div>
    );
  }

  const trends = await getKeywordTrends(30);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">SEO ranks</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Google position for the keywords we chase, logged nightly by the cron
        worker. Lower is better; a blank means we were not in the top 100 that
        day.
      </p>

      {!rankLoggingEnabled() && (
        <p className="mt-4 rounded-lg bg-gold/10 px-4 py-3 text-sm text-gold">
          Rank logging is not set up yet. Add a <code>SERPAPI_KEY</code> (from
          serpapi.com) so the nightly cron can record positions (see
          OPERATIONS.md). Until then this stays empty.
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-ink-faint">
            <tr>
              <th className="px-4 py-2 font-medium">Keyword</th>
              <th className="px-4 py-2 font-medium">Latest</th>
              <th className="px-4 py-2 font-medium">30-day trend</th>
              <th className="px-4 py-2 font-medium">Recent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {trends.map((t) => {
              const recent = t.history.slice(-7);
              return (
                <tr key={t.keyword}>
                  <td className="px-4 py-2 font-medium text-ink">{t.keyword}</td>
                  <td className="px-4 py-2 text-ink-soft">
                    {t.latest != null ? `#${t.latest}` : "-"}
                  </td>
                  <td className="px-4 py-2 text-ink-soft">
                    {trendArrow(t.history) || "-"}
                  </td>
                  <td className="px-4 py-2 text-ink-faint">
                    {recent.length === 0
                      ? "no data yet"
                      : recent
                          .map((h) => (h.position != null ? `#${h.position}` : "-"))
                          .join(" ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
