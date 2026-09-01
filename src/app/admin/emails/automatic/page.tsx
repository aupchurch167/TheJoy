import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import {
  dripStepsMeta,
  dripOverview,
  upcomingDripSends,
  recentDripSends,
  isDripPaused,
} from "@/lib/drip";
import {
  PageHeader,
  BackLink,
  Card,
  Badge,
  StatCard,
  SectionLabel,
  NotConnected,
} from "@/components/admin/ui";
import DripPauseToggle from "./DripPauseToggle";

export const dynamic = "force-dynamic";

// Module-level so Date.now() stays out of the render body.
function whenLabel(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.round(diff / 86_400_000);
  if (diff <= 60_000) return "next run";
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 14) return `in ${days} days`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function agoLabel(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default async function AutomaticEmailsPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Automatic emails" />
        <NotConnected what="Automatic emails" />
      </>
    );
  }

  const [steps, overview, upcoming, recent, paused] = await Promise.all([
    Promise.resolve(dripStepsMeta()),
    dripOverview(),
    upcomingDripSends(100),
    recentDripSends(14, 100),
    isDripPaused(),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <BackLink href="/admin/emails">Emails</BackLink>
      </div>
      <PageHeader
        title="Automatic emails (nurture drip)"
        description="Every new lead is automatically sent a short welcome, then three follow-ups over their first week. This is where those come from."
      />

      <DripPauseToggle paused={paused} />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="In the drip" value={String(overview.active)} tone="info" />
        <StatCard label="Finished" value={String(overview.completed)} />
        <StatCard label="Paused / opted out" value={String(overview.paused)} />
      </div>

      {/* The sequence */}
      <Card className="mb-6">
        <SectionLabel>The sequence</SectionLabel>
        <ol className="mt-3 space-y-2">
          {steps.map((s) => (
            <li key={s.key} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-16 flex-none items-center justify-center rounded-full bg-surface text-[11px] font-bold text-ink-soft">
                {s.delayDays === 0 ? "day 0" : `day ${s.delayDays}`}
              </span>
              <span className="text-sm text-ink">{s.subject}</span>
            </li>
          ))}
        </ol>
      </Card>

      {/* Upcoming */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <SectionLabel>Scheduled to go out</SectionLabel>
          {upcoming.length > 0 && (
            <span className="text-xs text-ink-faint">{upcoming.length} queued</span>
          )}
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-ink-faint">
            Nothing queued right now. New leads will appear here as they come in.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {upcoming.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">
                    {u.name}{" "}
                    <span className="font-normal text-ink-faint">
                      {u.email ? `· ${u.email}` : ""}
                    </span>
                  </div>
                  <div className="truncate text-xs text-ink-faint">{u.subject}</div>
                </div>
                <Badge tone={u.overdue && !paused ? "warning" : "neutral"}>
                  {paused ? "paused" : whenLabel(u.dueIso)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Recently sent */}
      <Card>
        <SectionLabel>Recently sent (last 14 days)</SectionLabel>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-ink-faint">
            No drip emails have gone out in the last two weeks.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {recent.map((r) => (
              <li
                key={`${r.id}-${r.sentIso}`}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">
                    {r.name}{" "}
                    <span className="font-normal text-ink-faint">
                      {r.email ? `· ${r.email}` : ""}
                    </span>
                  </div>
                  <div className="truncate text-xs text-ink-faint">{r.subject}</div>
                </div>
                <span className="flex-none text-xs text-ink-faint">
                  {agoLabel(r.sentIso)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
