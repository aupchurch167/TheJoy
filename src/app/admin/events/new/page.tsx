import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { PageHeader, BackLink, NotConnected } from "@/components/admin/ui";
import { aiEnabled } from "@/lib/ai";
import EventStudio from "../EventStudio";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  await requireAdmin();
  if (!hasDatabase()) {
    return (
      <div className="max-w-3xl">
        <div className="mb-4">
          <BackLink href="/admin/events">All events</BackLink>
        </div>
        <PageHeader title="New event" />
        <NotConnected what="Events" />
      </div>
    );
  }
  return (
    <EventStudio
      rsvps={[]}
      counts={{ yes: 0, no: 0, maybe: 0, headcount: 0 }}
      rsvpUrl=""
      aiEnabled={aiEnabled()}
    />
  );
}
