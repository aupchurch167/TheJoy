import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getEventById, listRsvps, getRsvpCounts } from "@/lib/events";
import { SITE_URL } from "@/lib/site";
import { aiEnabled } from "@/lib/ai";
import { PageHeader, NotConnected } from "@/components/admin/ui";
import EventStudio from "../EventStudio";

export const dynamic = "force-dynamic";

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
    <EventStudio
      event={event}
      rsvps={rsvps}
      counts={counts}
      rsvpUrl={rsvpUrl}
      aiEnabled={aiEnabled()}
    />
  );
}
