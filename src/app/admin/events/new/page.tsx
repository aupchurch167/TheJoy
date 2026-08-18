import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { PageHeader, BackLink, NotConnected } from "@/components/admin/ui";
import EventEditor from "../EventEditor";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <BackLink href="/admin/events">All events</BackLink>
      </div>
      <PageHeader title="New event" description="Fill in the details, then send invites." />
      {hasDatabase() ? <EventEditor /> : <NotConnected what="Events" />}
    </div>
  );
}
