import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getEventById, listRsvps, getRsvpCounts } from "@/lib/events";
import { formatEventWhen } from "@/lib/event-time";
import { PageHeader, NotConnected } from "@/components/admin/ui";
import AttendeesView, { type AttendeeRow } from "./AttendeesView";

export const dynamic = "force-dynamic";

export default async function AttendeesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Who's coming" />
        <NotConnected what="Attendees" />
      </>
    );
  }

  const event = await getEventById(id);
  if (!event) notFound();

  const [rsvps, counts] = await Promise.all([listRsvps(id), getRsvpCounts(id)]);

  const rows: AttendeeRow[] = rsvps.map((r) => ({
    id: r.id,
    name: r.name,
    response: r.response,
    guests: r.guests,
    bringing: r.bringing,
    note: r.note,
    email: r.email,
    phone: r.phone,
  }));

  const summary = [
    event.title,
    formatEventWhen(event.starts_at),
    event.location || undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <AttendeesView
      eventId={event.id}
      title={event.title}
      summary={summary}
      isPotluck={event.is_potluck}
      capacity={event.capacity ?? 0}
      counts={counts}
      rows={rows}
    />
  );
}
