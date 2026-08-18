import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getEventById, listRsvps, getRsvpCounts } from "@/lib/events";
import { formatEventWhenLong } from "@/lib/event-time";
import { SITE_URL, BUSINESS } from "@/lib/site";
import { PageHeader, NotConnected } from "@/components/admin/ui";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

const RESP_LABEL: Record<string, { label: string; color: string }> = {
  yes: { label: "Coming", color: "#1c7f27" },
  maybe: { label: "Maybe", color: "#8a6217" },
  no: { label: "Can't make it", color: "#626d70" },
};

export default async function RosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Event roster" />
        <NotConnected what="The roster" />
      </>
    );
  }

  const event = await getEventById(id);
  if (!event) notFound();

  const [rsvps, counts] = await Promise.all([listRsvps(id), getRsvpCounts(id)]);
  const dishes = rsvps.filter((r) => r.bringing).length;
  const rsvpUrl = `${SITE_URL}/rsvp/${event.rsvp_token}`;

  return (
    <div className="mx-auto max-w-[900px]">
      {/* Screen-only controls (hidden when printing) */}
      <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
        <Link
          href={`/admin/events/${event.id}/attendees`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-clay-dark hover:underline"
        >
          <span className="text-[15px]">←</span> Back to attendees
        </Link>
        <PrintButton />
      </div>

      {/* The roster document */}
      <div className="roster rounded-2xl border border-line bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-baseline justify-between border-b-[3px] border-clay-dark pb-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-clay-dark">
              {BUSINESS.name} · Event roster
            </div>
            <div className="mt-1 font-display text-[28px] font-bold text-ink">
              {event.title}
            </div>
          </div>
          <div className="text-right text-sm text-ink-soft">Printed for the door 💙</div>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-x-7 gap-y-1.5 text-[15px] text-ink">
          <div>
            <strong className="text-clay-dark">When:</strong>{" "}
            {formatEventWhenLong(event.starts_at)}
          </div>
          <div>
            <strong className="text-clay-dark">Where:</strong>{" "}
            {event.location || "Joy Senior Living, Loganville"}
          </div>
          <div>
            <strong className="text-clay-dark">Room for:</strong>{" "}
            {event.capacity && event.capacity > 0 ? event.capacity : "no limit"}
          </div>
          {event.is_potluck && (
            <div>
              <strong className="text-clay-dark">🍲 Potluck:</strong>{" "}
              {event.potluck_ask?.trim() || "a dish to share"}
            </div>
          )}
        </div>

        <div className="mt-3.5 flex flex-wrap gap-3">
          <RosterStat value={counts.headcount} label="headcount" color="#1c7f27" />
          <RosterStat value={counts.yes} label="yes" color="#071417" />
          <RosterStat value={counts.maybe} label="maybe" color="#8a6217" />
          <RosterStat value={counts.no} label="can't make it" color="#626d70" />
          {event.is_potluck && (
            <RosterStat value={dishes} label="dishes coming" color="#c98a2c" />
          )}
        </div>

        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left">
              <th className="py-1.5 pr-2 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-soft">
                Here?
              </th>
              <th className="px-2 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-soft">
                Name
              </th>
              <th className="px-2 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-soft">
                Response
              </th>
              <th className="px-2 py-1.5 text-center text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-soft">
                Party
              </th>
              <th className="px-2 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-soft">
                Bringing
              </th>
              <th className="py-1.5 pl-2 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-soft">
                Note
              </th>
            </tr>
          </thead>
          <tbody>
            {rsvps.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-ink-faint">
                  No RSVPs yet.
                </td>
              </tr>
            ) : (
              rsvps.map((r) => {
                const rl = RESP_LABEL[r.response];
                const isNo = r.response === "no";
                return (
                  <tr key={r.id} className="break-inside-avoid border-b border-line">
                    <td className="py-2 pr-2">
                      {!isNo && (
                        <span
                          className="inline-block h-[13px] w-[13px] rounded-[3px] border-[1.5px] border-ink"
                          aria-hidden
                        />
                      )}
                    </td>
                    <td
                      className="px-2 py-2 font-semibold"
                      style={{ color: isNo ? "#97a0a3" : "#071417" }}
                    >
                      {r.name}
                    </td>
                    <td className="px-2 py-2 font-semibold" style={{ color: rl.color }}>
                      {rl.label}
                    </td>
                    <td className="px-2 py-2 text-center" style={{ color: isNo ? "#97a0a3" : "#071417" }}>
                      {isNo ? "—" : 1 + r.guests}
                    </td>
                    <td className="px-2 py-2" style={{ color: r.bringing ? "#071417" : "#97a0a3" }}>
                      {r.bringing || "—"}
                    </td>
                    <td className="py-2 pl-2 text-ink-soft">
                      {r.note ? `“${r.note}”` : ""}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Walk-ins */}
        <div className="mt-6 break-inside-avoid">
          <div className="border-b-2 border-ink pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-soft">
            Walk-ins &amp; day-of notes
          </div>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[26px] border-b border-[#c6cdd0]" />
          ))}
        </div>

        <div className="mt-4 text-xs text-ink-faint">
          💙 {BUSINESS.name} · {BUSINESS.address.city}, {BUSINESS.address.state} · RSVP
          page: {rsvpUrl.replace(/^https?:\/\//, "")}
        </div>
      </div>

      {/* Keep colors and the checkbox borders when exporting to PDF. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@media print {
            .roster, .roster * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .roster table { font-size: 10pt; }
            @page { margin: 0.7in; }
          }`,
        }}
      />
    </div>
  );
}

function RosterStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="min-w-[92px] flex-1 rounded-lg border border-line px-3.5 py-2 text-center">
      <div className="text-[18px] font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-[10.5px] text-ink-soft">{label}</div>
    </div>
  );
}
