import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getLeadById } from "@/lib/leads";
import { getLeadEmailHistory, type LeadEmailRecord } from "@/lib/broadcasts";
import { toMailHref, toTelHref } from "@/lib/settings";
import { orDash, formatSource } from "@/lib/format";
import StageSelect from "../StageSelect";
import SubscriptionButton from "../SubscriptionButton";
import {
  PageHeader,
  BackLink,
  Card,
  Badge,
  SectionLabel,
  NotConnected,
  ButtonLink,
  type BadgeTone,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const STAGE_TONE: Record<string, BadgeTone> = {
  new: "info",
  toured: "warning",
  moved_in: "success",
  lost: "neutral",
  deceased: "neutral",
};

function dateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function dateShort(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysAgoLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

/** Delivery/engagement badge for one sent email. */
function emailStatus(r: LeadEmailRecord): { label: string; tone: BadgeTone } {
  if (r.error) return { label: "Failed", tone: "danger" };
  if (r.complained_at) return { label: "Marked spam", tone: "danger" };
  if (r.bounced_at) return { label: "Bounced", tone: "danger" };
  if (r.opened_at) return { label: "Opened", tone: "success" };
  return { label: "Sent", tone: "neutral" };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-ink-faint">{label}</span>
      <span className="text-sm font-medium text-ink">{children}</span>
    </div>
  );
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Lead" />
        <NotConnected what="This lead" />
      </>
    );
  }

  const lead = await getLeadById(id);
  if (!lead || lead.audience !== "leads") notFound();

  const emails = await getLeadEmailHistory(lead.id);
  const lastSent = emails[0]?.sent_at ?? null;

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <BackLink href="/admin/leads">Back to leads</BackLink>
      </div>

      <PageHeader
        title={orDash(lead.name)}
        description={
          lead.unsubscribed_at ? "This lead has unsubscribed from emails." : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            {lead.email && (
              <ButtonLink href={toMailHref(lead.email)} variant="secondary" size="sm">
                Email
              </ButtonLink>
            )}
            {lead.phone && (
              <ButtonLink href={toTelHref(lead.phone)} variant="secondary" size="sm">
                Call
              </ButtonLink>
            )}
            <SubscriptionButton
              id={lead.id}
              unsubscribed={!!lead.unsubscribed_at}
            />
          </div>
        }
      />

      {/* Message */}
      <Card className="mb-6">
        <SectionLabel>Their message</SectionLabel>
        {lead.message ? (
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
            {lead.message}
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-faint">
            No message was included with this inquiry.
          </p>
        )}
      </Card>

      {/* Stage + details */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionLabel>Details</SectionLabel>
          <div className="flex items-center gap-2">
            <Badge tone={STAGE_TONE[lead.stage] ?? "neutral"}>
              {lead.stage.replace(/_/g, " ")}
            </Badge>
            <StageSelect id={lead.id} stage={lead.stage} />
          </div>
        </div>

        <div className="mt-4">
          <Row label="Resident">{orDash(lead.resident_name)}</Row>
          <Row label="Email">
            {lead.email ? (
              <a
                href={toMailHref(lead.email)}
                className="break-all text-clay hover:text-clay-dark"
              >
                {lead.email}
              </a>
            ) : (
              "—"
            )}
          </Row>
          <Row label="Phone">
            {lead.phone ? (
              <a href={toTelHref(lead.phone)} className="text-clay hover:text-clay-dark">
                {lead.phone}
              </a>
            ) : (
              "—"
            )}
          </Row>
          <Row label="Source">{formatSource(lead.source)}</Row>
          <Row label="Received">{dateTime(lead.created_at)}</Row>
          <Row label="Stage updated">{dateTime(lead.stage_updated_at)}</Row>
          <Row label="Email consent">{lead.consent ? "Yes" : "No"}</Row>
          <Row label="Unsubscribed">
            {lead.unsubscribed_at ? dateTime(lead.unsubscribed_at) : "No"}
          </Row>
          <Row label="Nurture drip">
            {lead.drip_status === "active"
              ? `Active (step ${lead.drip_step})`
              : lead.drip_status}
          </Row>
          <Row label="Last emailed">
            {lastSent ? `${dateShort(lastSent)} (${daysAgoLabel(lastSent)})` : "Never"}
          </Row>
        </div>
      </Card>

      {/* Email history */}
      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <SectionLabel>Emails sent</SectionLabel>
          {emails.length > 0 && (
            <span className="text-xs text-ink-faint">
              {emails.length} total
            </span>
          )}
        </div>
        {emails.length === 0 ? (
          <p className="mt-3 text-sm text-ink-faint">
            No emails have been sent to this contact yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {emails.map((e) => {
              const status = emailStatus(e);
              return (
                <li
                  key={`${e.broadcast_id}-${e.sent_at}`}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">
                      {e.subject}
                    </div>
                    <div className="text-xs text-ink-faint">
                      {dateShort(e.sent_at)} · {daysAgoLabel(e.sent_at)}
                    </div>
                  </div>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
