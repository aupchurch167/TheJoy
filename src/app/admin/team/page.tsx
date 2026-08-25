import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { listSurveys } from "@/lib/employee-feedback";
import { ensureLifecycleSurveys } from "@/lib/employee-lifecycle";
import { countEmployees } from "@/lib/employees";
import LifecycleCard from "./LifecycleCard";
import {
  PageHeader,
  Card,
  Badge,
  ButtonLink,
  StatCard,
  SectionLabel,
  EmptyState,
  NotConnected,
  type BadgeTone,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, BadgeTone> = {
  draft: "neutral",
  open: "success",
  closed: "warning",
};

function pct(done: number, total: number): string {
  if (total <= 0) return "—";
  return `${Math.round((done / total) * 100)}%`;
}

export default async function TeamPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Team feedback" />
        <NotConnected what="Team feedback" />
      </>
    );
  }

  // Make sure the onboarding/exit templates exist so they always show.
  await ensureLifecycleSurveys();
  const [surveys, counts] = await Promise.all([listSurveys(), countEmployees()]);
  const lifecycle = surveys.filter((s) => s.kind !== "pulse");
  const pulses = surveys.filter((s) => s.kind === "pulse");

  return (
    <>
      <PageHeader
        title="Team feedback"
        description="Pulse surveys for your staff. Anonymous or named, your choice per survey."
        actions={
          <div className="flex items-center gap-2">
            <ButtonLink href="/admin/team/roster" variant="secondary" size="sm">
              Roster ({counts.active})
            </ButtonLink>
            <ButtonLink href="/admin/team/new" size="sm">
              New survey
            </ButtonLink>
          </div>
        }
      />

      {counts.active === 0 && (
        <Card className="mb-6 border-gold/40 bg-gold/[0.06]">
          <p className="text-sm text-ink">
            No employees on the roster yet.{" "}
            <Link href="/admin/team/roster" className="font-semibold text-clay-dark">
              Add your team
            </Link>{" "}
            (by hand or a CSV) before sending a survey.
          </p>
        </Card>
      )}

      <LifecycleCard
        rows={lifecycle.map((s) => ({
          id: s.id,
          title: s.title,
          kind: s.kind,
          send_offset_days: s.send_offset_days,
          auto_enroll: s.auto_enroll,
          completed: Number(s.completed),
        }))}
      />

      <div className="mb-2 mt-8">
        <SectionLabel>Pulse surveys</SectionLabel>
      </div>
      {pulses.length === 0 ? (
        <EmptyState
          title="No pulse surveys yet"
          description="Create a short pulse survey and send it to your team."
        />
      ) : (
        <div className="space-y-3">
          {pulses.map((s) => {
            const sent = Number(s.sent);
            const completed = Number(s.completed);
            return (
              <Link key={s.id} href={`/admin/team/${s.id}`} className="block">
                <Card className="transition-colors hover:border-clay/40">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg font-semibold text-ink">
                          {s.title}
                        </h3>
                        <Badge tone={STATUS_TONE[s.status] ?? "neutral"}>
                          {s.status}
                        </Badge>
                        <Badge tone={s.anonymous ? "info" : "neutral"}>
                          {s.anonymous ? "anonymous" : "named"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-ink-faint">
                        {s.questions.length} question
                        {s.questions.length === 1 ? "" : "s"}
                        {sent > 0
                          ? ` · sent to ${sent} · ${completed} answered (${pct(completed, sent)})`
                          : " · not sent yet"}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-sm font-semibold text-clay-dark">
                      Open →
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <StatCard label="Active employees" value={String(counts.active)} />
      </div>
    </>
  );
}
