import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { listEvents, getRsvpCountsByEvent } from "@/lib/events";
import { formatEventWhen } from "@/lib/event-time";
import {
  PageHeader,
  ButtonLink,
  Badge,
  EmptyState,
  NotConnected,
  type BadgeTone,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, BadgeTone> = {
  draft: "neutral",
  published: "success",
  cancelled: "danger",
};

export default async function EventsPage() {
  await requireAdmin();

  const actions = (
    <ButtonLink href="/admin/events/new" variant="primary" size="sm">
      New event
    </ButtonLink>
  );

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Events" description="Invites, RSVPs, and reminders." />
        <NotConnected what="Events" />
      </>
    );
  }

  const [events, counts] = await Promise.all([
    listEvents(),
    getRsvpCountsByEvent(),
  ]);

  return (
    <>
      <PageHeader
        title="Events"
        description="Create an event, send invites, collect RSVPs, and see who is coming."
        actions={actions}
      />

      {events.length === 0 ? (
        <EmptyState
          icon="🎉"
          title="No events yet"
          description="Create a support group, birthday party, or family dinner, then send the invites."
          action={
            <ButtonLink href="/admin/events/new" variant="primary">
              New event
            </ButtonLink>
          }
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-sm">
          {events.map((ev) => {
            const c = counts[ev.id] ?? { yes: 0, headcount: 0 };
            return (
              <li key={ev.id}>
                <Link
                  href={`/admin/events/${ev.id}`}
                  className="flex min-h-16 cursor-pointer items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium text-ink">
                        {ev.title}
                      </span>
                      <Badge tone={STATUS_TONE[ev.status] ?? "neutral"}>
                        {ev.status}
                      </Badge>
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-ink-faint">
                      {formatEventWhen(ev.starts_at)}
                      {ev.location ? ` · ${ev.location}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-sm text-ink-soft">
                    {c.headcount} coming
                    <span className="text-ink-faint"> ({c.yes} yes)</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
