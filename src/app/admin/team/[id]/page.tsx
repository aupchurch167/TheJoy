import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import {
  getSurveyById,
  getSurveySummary,
  listResponses,
} from "@/lib/employee-feedback";
import { listReachableEmployees } from "@/lib/employees";
import {
  PageHeader,
  BackLink,
  Card,
  Badge,
  StatCard,
  SectionLabel,
  NotConnected,
  type BadgeTone,
} from "@/components/admin/ui";
import SurveyControls from "./SurveyControls";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, BadgeTone> = {
  draft: "neutral",
  open: "success",
  closed: "warning",
};

function dateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Survey" />
        <NotConnected what="This survey" />
      </>
    );
  }

  const survey = await getSurveyById(id);
  if (!survey) notFound();

  const [summary, responses, reachable] = await Promise.all([
    getSurveySummary(id),
    listResponses(id),
    listReachableEmployees(),
  ]);

  const ratingQs = survey.questions.filter((q) => q.type === "rating");
  const textQs = survey.questions.filter((q) => q.type === "text");
  const ratePct =
    summary.responseRate == null
      ? "—"
      : `${Math.round(summary.responseRate * 100)}%`;

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <BackLink href="/admin/team">Team feedback</BackLink>
      </div>

      <PageHeader
        title={survey.title}
        actions={
          <SurveyControls
            surveyId={survey.id}
            status={survey.status}
            reachable={reachable.length}
          />
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge tone={STATUS_TONE[survey.status] ?? "neutral"}>{survey.status}</Badge>
        <Badge tone={survey.anonymous ? "info" : "neutral"}>
          {survey.anonymous ? "anonymous" : "named"}
        </Badge>
        <span className="text-sm text-ink-faint">
          Created {dateShort(survey.created_at)}
        </span>
      </div>

      {survey.intro && (
        <Card className="mb-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
            {survey.intro}
          </p>
        </Card>
      )}

      {/* Results */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Sent" value={String(summary.sent)} />
        <StatCard
          label="Answered"
          value={String(summary.completed)}
          hint={`${ratePct} response rate`}
          tone="success"
        />
        <StatCard
          label="Positive"
          value={String(summary.positive)}
          tone="success"
        />
        <StatCard
          label="Concerns"
          value={String(summary.concern)}
          tone={summary.concern > 0 ? "danger" : "neutral"}
        />
      </div>

      {/* Rating averages */}
      {ratingQs.length > 0 && summary.responses > 0 && (
        <Card className="mb-6">
          <SectionLabel>Average ratings (1–5)</SectionLabel>
          <div className="mt-4 space-y-3">
            {ratingQs.map((q) => {
              const avg = summary.ratingAverages[q.key];
              const wpct = avg == null ? 0 : (avg / 5) * 100;
              return (
                <div key={q.key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink">{q.label}</span>
                    <span className="font-semibold text-ink">
                      {avg == null ? "—" : avg.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-clay"
                      style={{ width: `${wpct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Responses */}
      <Card>
        <div className="flex items-center justify-between">
          <SectionLabel>Responses</SectionLabel>
          {survey.anonymous && summary.responses > 0 && (
            <span className="text-xs text-ink-faint">
              Names hidden (anonymous survey)
            </span>
          )}
        </div>

        {responses.length === 0 ? (
          <p className="mt-3 text-sm text-ink-faint">
            No responses yet.
            {summary.sent === 0 && " Send the survey to your team to start collecting."}
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {responses.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-line bg-paper p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">
                    {survey.anonymous
                      ? "Anonymous"
                      : r.employee_name ?? "Unknown"}
                  </span>
                  <div className="flex items-center gap-2">
                    {r.sentiment && (
                      <Badge tone={r.sentiment === "concern" ? "danger" : "success"}>
                        {r.sentiment}
                      </Badge>
                    )}
                    <span className="text-xs text-ink-faint">
                      {dateShort(r.submitted_at)}
                    </span>
                  </div>
                </div>

                {ratingQs.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                    {ratingQs.map((q) => {
                      const v = r.answers?.[q.key];
                      if (v == null) return null;
                      return (
                        <span key={q.key}>
                          {q.label.replace(/\?$/, "")}:{" "}
                          <strong className="text-ink">{String(v)}/5</strong>
                        </span>
                      );
                    })}
                  </div>
                )}

                {textQs.map((q) => {
                  const v = r.answers?.[q.key];
                  if (!v) return null;
                  return (
                    <div key={q.key} className="mt-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                        {q.label}
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink">
                        {String(v)}
                      </p>
                    </div>
                  );
                })}

                {r.comment && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink">
                    {r.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
