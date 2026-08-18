import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getEventById, listRsvps, getRsvpCounts } from "@/lib/events";
import { formatEventWhenLong } from "@/lib/event-time";
import { SITE_URL } from "@/lib/site";
import { orDash } from "@/lib/format";
import EventEditor from "../EventEditor";
import EventActions from "../EventActions";
import RemoveRsvpButton from "../RemoveRsvpButton";
import {
  PageHeader,
  BackLink,
  Card,
  SectionLabel,
  StatCard,
  Badge,
  TableWrap,
  Th,
  Td,
  EmptyState,
  NotConnected,
  type BadgeTone,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const RESPONSE_TONE: Record<string, BadgeTone> = {
  yes: "success",
  maybe: "warning",
  no: "neutral",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Event" />
        <NotConnected what="This event" />
      </>
    );
  }

  const event = await getEventById(id);
  if (!event) notFound();

  const [rsvps, counts] = await Promise.all([listRsvps(id), getRsvpCounts(id)]);
  const rsvpUrl = `${SITE_URL}/rsvp/${event.rsvp_token}`;

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <BackLink href="/admin/events">All events</BackLink>
      </div>

      <PageHeader
        title={event.title}
        description={formatEventWhenLong(event.starts_at)}
      />

      {/* Send invites / reminders + copy the RSVP link */}
      <Card className="mb-6">
        <SectionLabel>Invites and RSVP link</SectionLabel>
        <p className="mt-1 text-sm text-ink-soft">
          Building an email opens the composer, where you choose recipients
          (families, or a segment) and send. Anyone with the RSVP link can
          respond, so you can share it anywhere.
        </p>
        <div className="mt-3">
          <EventActions eventId={event.id} rsvpUrl={rsvpUrl} />
        </div>
        <p className="mt-3 break-all text-xs text-ink-faint">{rsvpUrl}</p>
      </Card>

      {/* Who's coming */}
      <section className="mb-8">
        <SectionLabel>Who is coming</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Coming (headcount)" value={counts.headcount} tone="success" />
          <StatCard label="Yes" value={counts.yes} />
          <StatCard label="Maybe" value={counts.maybe} tone="warning" />
          <StatCard label="Can't make it" value={counts.no} />
        </div>

        <div className="mt-4">
          {rsvps.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No RSVPs yet"
              description="Responses appear here as people fill in the RSVP form."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr className="border-b border-line">
                  <Th>Name</Th>
                  <Th>Response</Th>
                  <Th>Party</Th>
                  <Th>Contact</Th>
                  <Th>Note</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rsvps.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-surface">
                    <Td className="font-medium text-ink">{orDash(r.name)}</Td>
                    <Td>
                      <Badge tone={RESPONSE_TONE[r.response] ?? "neutral"}>
                        {r.response === "yes"
                          ? "Coming"
                          : r.response === "maybe"
                            ? "Maybe"
                            : "Can't make it"}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap text-ink-soft">
                      {r.response === "yes" ? 1 + r.guests : "—"}
                      {r.response === "yes" && r.guests > 0 ? (
                        <span className="text-ink-faint"> (+{r.guests})</span>
                      ) : null}
                    </Td>
                    <Td className="text-ink-soft">
                      <div className="break-all">{orDash(r.email)}</div>
                      {r.phone && (
                        <div className="text-xs text-ink-faint">{r.phone}</div>
                      )}
                    </Td>
                    <Td className="max-w-[16rem] text-ink-soft">
                      {r.note ? (
                        <span className="line-clamp-2">{r.note}</span>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="text-right">
                      <RemoveRsvpButton id={r.id} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </div>
      </section>

      {/* Edit event */}
      <section>
        <SectionLabel>Event details</SectionLabel>
        <div className="mt-3">
          <EventEditor event={event} />
        </div>
      </section>
    </div>
  );
}
