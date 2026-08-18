import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { listEvents, getRsvpCountsByEvent } from "@/lib/events";
import { formatEventWhen, eventDateTile, eventIsPast } from "@/lib/event-time";
import { PageHeader, NotConnected } from "@/components/admin/ui";
import EventsList, { type EventListItem } from "./EventsList";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Events" description="Invites, RSVPs, and reminders." />
        <NotConnected what="Events" />
      </>
    );
  }

  const [allEvents, counts] = await Promise.all([
    listEvents(),
    getRsvpCountsByEvent(),
  ]);

  // Upcoming (draft or published) soonest-first; past/cancelled most-recent-first.
  const isPastOrCancelled = (ev: (typeof allEvents)[number]) =>
    ev.status === "cancelled" ||
    (ev.status === "published" && eventIsPast(ev.starts_at));
  const upcomingEvents = allEvents
    .filter((ev) => !isPastOrCancelled(ev))
    .sort((a, b) => {
      const at = a.starts_at ? new Date(a.starts_at).getTime() : Infinity;
      const bt = b.starts_at ? new Date(b.starts_at).getTime() : Infinity;
      return at - bt;
    });
  const pastEvents = allEvents.filter(isPastOrCancelled);
  const events = [...upcomingEvents, ...pastEvents];

  const items: EventListItem[] = events.map((ev) => {
    const c = counts[ev.id] ?? { yes: 0, headcount: 0 };
    const status: EventListItem["status"] =
      ev.status === "cancelled"
        ? "cancelled"
        : ev.status === "published" && eventIsPast(ev.starts_at)
          ? "done"
          : (ev.status as "draft" | "published");
    const tile = eventDateTile(ev.starts_at);
    return {
      id: ev.id,
      title: ev.title,
      status,
      month: tile.month,
      day: tile.day,
      when: formatEventWhen(ev.starts_at),
      where: ev.location ?? "",
      isPotluck: ev.is_potluck,
      headcount: c.headcount,
      yes: c.yes,
      capacity: ev.capacity ?? 0,
    };
  });

  return <EventsList events={items} />;
}
