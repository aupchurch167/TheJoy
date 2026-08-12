import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getLeadById } from "@/lib/leads";
import { toMailHref, toTelHref } from "@/lib/settings";
import { orDash, formatSource } from "@/lib/format";
import StageSelect from "../StageSelect";
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
};

function dateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
        </div>
      </Card>
    </div>
  );
}
