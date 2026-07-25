import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getAllLeads, getSourceReport } from "@/lib/leads";
import { formatDate, formatPercent, orDash } from "@/lib/format";
import StageSelect from "./StageSelect";
import {
  PageHeader,
  Badge,
  StatCard,
  EmptyState,
  NotConnected,
  SectionLabel,
  ButtonLink,
  TableWrap,
  Th,
  Td,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  await requireAdmin();
  const { source } = await searchParams;

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Leads" />
        <NotConnected what="Leads" />
      </>
    );
  }

  const [report, leads] = await Promise.all([
    getSourceReport(),
    getAllLeads(source),
  ]);

  const totalLeads = report.reduce((n, r) => n + r.total, 0);
  const totalToured = report.reduce((n, r) => n + r.toured, 0);
  const totalMovedIn = report.reduce((n, r) => n + r.moved_in, 0);
  const tourRate = totalLeads > 0 ? totalToured / totalLeads : null;

  return (
    <>
      <PageHeader
        title="Leads"
        description="Everyone who has reached out, and where they came from. Update a stage inline as families progress."
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total leads" value={totalLeads} />
        <StatCard label="Toured" value={totalToured} tone="warning" />
        <StatCard label="Moved in" value={totalMovedIn} tone="success" />
        <StatCard
          label="Tour rate"
          value={formatPercent(tourRate)}
          hint="Share of leads who toured"
        />
      </div>

      {/* Source attribution report */}
      <section className="mt-10">
        <SectionLabel>By source</SectionLabel>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Where leads come from, and how many booked a tour or moved in. This is
          how you see which channels work (and reduce reliance on any one).
        </p>
        <div className="mt-3">
          {report.length === 0 ? (
            <EmptyState
              icon="📊"
              title="No leads yet"
              description="Once families submit the contact form or arrive through TalkFurther, they'll show up here by source."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr className="border-b border-line">
                  <Th>Source</Th>
                  <Th className="text-right">Leads</Th>
                  <Th className="text-right">Toured</Th>
                  <Th className="text-right">Moved in</Th>
                  <Th className="text-right">Lost</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.map((r) => (
                  <tr key={r.source} className="transition-colors hover:bg-surface">
                    <Td className="font-medium text-ink">{orDash(r.source)}</Td>
                    <Td className="text-right text-ink-soft">{r.total}</Td>
                    <Td className="text-right text-ink-soft">{r.toured}</Td>
                    <Td className="text-right text-ink-soft">{r.moved_in}</Td>
                    <Td className="text-right text-ink-soft">{r.lost}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </div>
      </section>

      {/* Lead list with stage editing */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionLabel>
            All leads{" "}
            {source && (
              <Badge tone="info" className="ml-1 normal-case tracking-normal">
                source: {source}
              </Badge>
            )}
          </SectionLabel>
          {source && (
            <ButtonLink href="/admin/leads" variant="ghost" size="sm">
              Clear filter
            </ButtonLink>
          )}
        </div>
        <div className="mt-3">
          {leads.length === 0 ? (
            <EmptyState
              icon="🧾"
              title={source ? "No leads from this source" : "No leads yet"}
              description={
                source
                  ? "Try clearing the filter to see every lead."
                  : "New leads from the contact form and TalkFurther will appear here."
              }
              action={
                source ? (
                  <ButtonLink href="/admin/leads" variant="secondary">
                    Clear filter
                  </ButtonLink>
                ) : undefined
              }
            />
          ) : (
            <TableWrap>
              <thead>
                <tr className="border-b border-line">
                  <Th>Name</Th>
                  <Th>Contact</Th>
                  <Th>Source</Th>
                  <Th>Added</Th>
                  <Th>Stage</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {leads.map((lead) => (
                  <tr key={lead.id} className="transition-colors hover:bg-surface">
                    <Td>
                      <span className="font-medium text-ink">
                        {orDash(lead.name)}
                      </span>
                      {lead.unsubscribed_at && (
                        <Badge tone="neutral" className="ml-2">
                          unsubscribed
                        </Badge>
                      )}
                    </Td>
                    <Td className="text-ink-soft">
                      <div className="break-all">{orDash(lead.email)}</div>
                      {lead.phone && (
                        <div className="text-ink-faint">{lead.phone}</div>
                      )}
                    </Td>
                    <Td className="text-ink-soft">{orDash(lead.source)}</Td>
                    <Td className="whitespace-nowrap text-ink-faint">
                      {formatDate(lead.created_at)}
                    </Td>
                    <Td>
                      <StageSelect id={lead.id} stage={lead.stage} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </div>
      </section>
    </>
  );
}
