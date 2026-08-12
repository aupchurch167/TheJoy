import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import {
  getAllLeads,
  getSourceReport,
  IMPORT_SOURCE_PREFIX,
} from "@/lib/leads";
import { resolveRange, type RangeKey } from "@/lib/date-range";
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

const PRESETS: { key: RangeKey; label: string; range?: string }[] = [
  { key: "all", label: "All time" },
  { key: "7d", label: "Last 7 days", range: "7d" },
  { key: "30d", label: "Last 30 days", range: "30d" },
  { key: "90d", label: "Last 90 days", range: "90d" },
];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    source?: string;
    range?: string;
    from?: string;
    to?: string;
    imports?: string;
  }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const source = sp.source;
  const range = resolveRange(sp);

  // Imported (pre-website) leads are hidden by default so website numbers stay
  // clean. Show them when toggled on, or when the source filter is an import.
  const showImports =
    sp.imports === "1" || Boolean(source?.startsWith(IMPORT_SOURCE_PREFIX));
  const excludeImports = !showImports;

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Leads" />
        <NotConnected what="Leads" />
      </>
    );
  }

  const [report, leads] = await Promise.all([
    getSourceReport({ from: range.from, to: range.to, excludeImports }),
    getAllLeads({ source, from: range.from, to: range.to, excludeImports }),
  ]);

  const totalLeads = report.reduce((n, r) => n + r.total, 0);
  const totalToured = report.reduce((n, r) => n + r.toured, 0);
  const totalMovedIn = report.reduce((n, r) => n + r.moved_in, 0);
  const tourRate = totalLeads > 0 ? totalToured / totalLeads : null;

  // Build a leads URL, always preserving the active source filter.
  const hrefWith = (params: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    if (source) q.set("source", source);
    if (sp.imports === "1") q.set("imports", "1");
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    const s = q.toString();
    return `/admin/leads${s ? `?${s}` : ""}`;
  };

  // Toggle imports on/off while keeping the current date range.
  const importsToggleHref = (() => {
    const q = new URLSearchParams();
    if (source) q.set("source", source);
    if (sp.range) q.set("range", sp.range);
    if (sp.from) q.set("from", sp.from);
    if (sp.to) q.set("to", sp.to);
    if (sp.imports !== "1") q.set("imports", "1");
    const s = q.toString();
    return `/admin/leads${s ? `?${s}` : ""}`;
  })();

  return (
    <>
      <PageHeader
        title="Leads"
        description="Everyone who has reached out, and where they came from. Filter by date, open a lead to read its message, and update a stage as families progress."
      />

      {/* Date filter */}
      <div className="mb-6 rounded-xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => {
            const active = range.key === p.key;
            return (
              <Link
                key={p.key}
                href={hrefWith({ range: p.range })}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-clay/10 text-clay"
                    : "text-ink-soft hover:bg-surface"
                }`}
              >
                {p.label}
              </Link>
            );
          })}

          {/* Custom range (GET form; from/to imply a custom range) */}
          <form
            method="get"
            action="/admin/leads"
            className="ml-auto flex flex-wrap items-center gap-2"
          >
            {source && <input type="hidden" name="source" value={source} />}
            <label className="text-xs text-ink-faint">
              From{" "}
              <input
                type="date"
                name="from"
                defaultValue={sp.from || ""}
                className="ml-1 h-9 rounded-lg border border-line bg-white px-2 text-sm text-ink focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30"
              />
            </label>
            <label className="text-xs text-ink-faint">
              To{" "}
              <input
                type="date"
                name="to"
                defaultValue={sp.to || ""}
                className="ml-1 h-9 rounded-lg border border-line bg-white px-2 text-sm text-ink focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30"
              />
            </label>
            <button
              type="submit"
              className="h-9 rounded-lg bg-clay px-3 text-sm font-semibold text-white hover:bg-clay-dark"
            >
              Apply
            </button>
          </form>
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          Showing <span className="font-medium text-ink-soft">{range.label}</span>
          {range.key === "custom" && (
            <>
              {" · "}
              <Link href={hrefWith({})} className="text-clay hover:text-clay-dark">
                Reset
              </Link>
            </>
          )}
          {" · "}
          {showImports ? (
            <>
              Including imported (pre-website) leads{" "}
              <Link
                href={importsToggleHref}
                className="text-clay hover:text-clay-dark"
              >
                Hide imports
              </Link>
            </>
          ) : (
            <>
              Website leads only{" "}
              <Link
                href={importsToggleHref}
                className="text-clay hover:text-clay-dark"
              >
                Show imported
              </Link>
            </>
          )}
        </p>
      </div>

      {/* Summary stats (reflect the selected range) */}
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
              title="No leads in this range"
              description="Try a wider date range, or check back as families reach out."
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
            <ButtonLink href={hrefWith({ range: sp.range })} variant="ghost" size="sm">
              Clear source filter
            </ButtonLink>
          )}
        </div>
        <div className="mt-3">
          {leads.length === 0 ? (
            <EmptyState
              icon="🧾"
              title="No leads to show"
              description="Try a wider date range or clear the source filter. New leads from the contact form and TalkFurther appear here."
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
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="font-medium text-clay hover:text-clay-dark hover:underline"
                      >
                        {orDash(lead.name)}
                      </Link>
                      {lead.message && (
                        <span className="ml-2 align-middle text-xs text-ink-faint">
                          💬
                        </span>
                      )}
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
