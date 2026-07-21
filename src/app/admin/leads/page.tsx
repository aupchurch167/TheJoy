import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getAllLeads, getSourceReport } from "@/lib/leads";
import StageSelect from "./StageSelect";

export const dynamic = "force-dynamic";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  await requireAdmin();
  const { source } = await searchParams;

  if (!hasDatabase()) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-display text-2xl font-semibold text-ink">Leads</h1>
        <p className="mt-4 rounded-lg bg-clay/10 px-4 py-3 text-clay-dark">
          The database is not connected yet. Set DATABASE_URL and run{" "}
          <code>npm run migrate</code>.
        </p>
      </div>
    );
  }

  const [report, leads] = await Promise.all([
    getSourceReport(),
    getAllLeads(source),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">Leads</h1>

      {/* Source attribution report */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
          By source
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Where leads come from, and how many booked a tour or moved in. This is
          how you see which channels work (and reduce reliance on any one of them).
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-ink-faint">
              <tr>
                <th className="px-4 py-2 font-medium">Source</th>
                <th className="px-4 py-2 font-medium">Leads</th>
                <th className="px-4 py-2 font-medium">Toured</th>
                <th className="px-4 py-2 font-medium">Moved in</th>
                <th className="px-4 py-2 font-medium">Lost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {report.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-ink-faint">
                    No leads yet.
                  </td>
                </tr>
              ) : (
                report.map((r) => (
                  <tr key={r.source}>
                    <td className="px-4 py-2 font-medium text-ink">{r.source}</td>
                    <td className="px-4 py-2 text-ink-soft">{r.total}</td>
                    <td className="px-4 py-2 text-ink-soft">{r.toured}</td>
                    <td className="px-4 py-2 text-ink-soft">{r.moved_in}</td>
                    <td className="px-4 py-2 text-ink-soft">{r.lost}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Lead list with stage editing */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
            All leads {source ? `(source: ${source})` : ""}
          </h2>
          {source && (
            <a href="/admin/leads" className="text-sm text-clay hover:underline">
              Clear filter
            </a>
          )}
        </div>
        <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-ink-faint">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Contact</th>
                <th className="px-4 py-2 font-medium">Source</th>
                <th className="px-4 py-2 font-medium">Added</th>
                <th className="px-4 py-2 font-medium">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-ink-faint">
                    No leads.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-4 py-2">
                      <span className="font-medium text-ink">{lead.name}</span>
                      {lead.unsubscribed_at && (
                        <span className="ml-2 rounded-full bg-line/70 px-2 py-0.5 text-xs text-ink-faint">
                          unsubscribed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-ink-soft">
                      <div>{lead.email}</div>
                      {lead.phone && (
                        <div className="text-ink-faint">{lead.phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-ink-soft">{lead.source}</td>
                    <td className="px-4 py-2 text-ink-faint">
                      {fmtDate(lead.created_at)}
                    </td>
                    <td className="px-4 py-2">
                      <StageSelect id={lead.id} stage={lead.stage} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
