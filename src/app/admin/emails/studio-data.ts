import { listEvents, getRsvpCountsByEvent } from "@/lib/events";
import { formatEventWhen } from "@/lib/event-time";
import { SITE_URL } from "@/lib/site";
import type { StudioEvent } from "./EmailStudio";

/**
 * Upcoming, sendable events for the studio's "Link an event" panel. Published
 * events whose start is in the future (undated events are kept, so a rough
 * placeholder event still links). Newest-soonest first.
 */
export async function loadStudioEvents(): Promise<StudioEvent[]> {
  const [events, counts] = await Promise.all([
    listEvents(),
    getRsvpCountsByEvent(),
  ]);
  const now = Date.now();
  return events
    .filter(
      (e) =>
        e.status === "published" &&
        (!e.starts_at || new Date(e.starts_at).getTime() >= now - 6 * 3600_000)
    )
    .sort((a, b) => {
      const at = a.starts_at ? new Date(a.starts_at).getTime() : Infinity;
      const bt = b.starts_at ? new Date(b.starts_at).getTime() : Infinity;
      return at - bt;
    })
    .slice(0, 8)
    .map((e) => ({
      id: e.id,
      title: e.title,
      whenText: formatEventWhen(e.starts_at),
      location: e.location,
      rsvpUrl: `${SITE_URL}/rsvp/${e.rsvp_token}`,
      yes: counts[e.id]?.yes ?? 0,
    }));
}

/** First LEAD_NOTIFY_TO address, used to prefill the test-send box. */
export function defaultTestAddress(): string {
  return (process.env.LEAD_NOTIFY_TO || "").split(",")[0]?.trim() || "";
}
