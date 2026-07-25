import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getKeywordTrends, rankLoggingEnabled } from "@/lib/ranks";
import {
  PageHeader,
  Badge,
  EmptyState,
  NotConnected,
  TableWrap,
  Th,
  Td,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

/** Trend badge: lower Google position is better, so a drop in number is "up". */
function trend(history: { position: number | null }[]) {
  const pts = history.filter((h) => h.position != null).map((h) => h.position!);
  if (pts.length < 2) return null;
  const delta = pts[pts.length - 1] - pts[0];
  if (delta < 0) return { tone: "success" as const, label: `▲ up ${Math.abs(delta)}` };
  if (delta > 0) return { tone: "danger" as const, label: `▼ down ${delta}` };
  return { tone: "neutral" as const, label: "no change" };
}

export default async function SeoPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="SEO ranks" />
        <NotConnected what="SEO ranks" />
      </>
    );
  }

  const trends = await getKeywordTrends(30);
  const tracked = trends.length;
  const ranking = trends.filter((t) => t.latest != null).length;
  const bestRank = trends.reduce<number | null>((best, t) => {
    if (t.latest == null) return best;
    return best == null ? t.latest : Math.min(best, t.latest);
  }, null);

  return (
    <>
      <PageHeader
        title="SEO ranks"
        description="Google position for the keywords Joy chases, logged nightly by the cron worker. Lower is better; a dash means we were not in the top 100 that day."
      />

      {!rankLoggingEnabled() && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          <span aria-hidden>⚠️</span>
          <p>
            Rank logging is off until a <code>SERPAPI_KEY</code> is set (from
            serpapi.com), so the nightly cron can record positions (see
            OPERATIONS.md).
          </p>
        </div>
      )}

      {tracked > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Tracked
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink">
              {tracked}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              In top 100
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-sage">
              {ranking}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Best rank
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-clay">
              {bestRank != null ? `#${bestRank}` : "—"}
            </p>
          </div>
        </div>
      )}

      {trends.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No keywords tracked yet"
          description="Keywords come from TRACKED_KEYWORDS in the code. Once the nightly cron runs with a SerpApi key, positions show up here."
        />
      ) : (
        <TableWrap>
          <thead>
            <tr className="border-b border-line">
              <Th>Keyword</Th>
              <Th className="text-right">Latest</Th>
              <Th>30-day trend</Th>
              <Th>Recent (last 7)</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {trends.map((t) => {
              const recent = t.history.slice(-7);
              const tr = trend(t.history);
              return (
                <tr key={t.keyword} className="transition-colors hover:bg-surface">
                  <Td className="font-medium text-ink">{t.keyword}</Td>
                  <Td className="text-right text-ink-soft">
                    {t.latest != null ? `#${t.latest}` : "—"}
                  </Td>
                  <Td>{tr ? <Badge tone={tr.tone}>{tr.label}</Badge> : "—"}</Td>
                  <Td className="font-mono text-xs text-ink-faint">
                    {recent.length === 0
                      ? "no data yet"
                      : recent
                          .map((h) => (h.position != null ? `#${h.position}` : "—"))
                          .join("  ")}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
