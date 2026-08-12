import { sendMarketingEmail, emailEnabled } from "./email";
import { getSubscribedByAudience } from "./leads";
import {
  getDueBroadcasts,
  markBroadcastSending,
  markBroadcastSent,
  requeueBroadcast,
  recordRecipient,
  alreadySentLeadIds,
  sentInLastHour,
  sentCountForBroadcast,
  type Broadcast,
} from "./broadcasts";

/**
 * Deliverability throttle. Marketing blasts that go out all at once look like
 * spam to inbox providers, so sends are metered:
 *  - at most BROADCAST_HOURLY_CAP successful sends per rolling hour (across all
 *    broadcasts), measured from broadcast_recipients.sent_at so it is
 *    independent of how often the cron runs;
 *  - only inside the daytime send window (no overnight sends).
 * A broadcast that can't finish in one run is returned to the queue and
 * continues on later runs; per-recipient dedupe means nobody is emailed twice.
 * All values are overridable by env for a given deployment.
 */
const TZ = process.env.BROADCAST_TZ || "America/New_York";
export const BROADCAST_HOURLY_CAP = Math.max(
  1,
  Number(process.env.BROADCAST_HOURLY_CAP) || 30
);
const SEND_START_HOUR = hourEnv(process.env.BROADCAST_SEND_START_HOUR, 8);
const SEND_END_HOUR = hourEnv(process.env.BROADCAST_SEND_END_HOUR, 21);

function hourEnv(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n <= 24 ? n : fallback;
}

/** Current hour (0-23) in the business timezone. */
function currentHour(): number {
  const s = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    hour12: false,
  }).format(new Date());
  return Number(s) % 24;
}

/** Is now inside the allowed daytime send window? (handles a wrapped window.) */
export function isWithinSendWindow(h: number = currentHour()): boolean {
  if (SEND_START_HOUR === SEND_END_HOUR) return true; // 24h
  if (SEND_START_HOUR < SEND_END_HOUR)
    return h >= SEND_START_HOUR && h < SEND_END_HOUR;
  return h >= SEND_START_HOUR || h < SEND_END_HOUR;
}

/** A short human summary of the current throttle (for admin messages). */
export function throttleSummary(): string {
  return `about ${BROADCAST_HOURLY_CAP}/hour, ${SEND_START_HOUR}:00-${SEND_END_HOUR}:00 ${TZ.split("/").pop()?.replace("_", " ")}`;
}

/**
 * Send up to `cap` more emails for one broadcast. Returns how many went out and
 * whether the broadcast is finished (every pending recipient handled).
 */
async function sendBatch(
  broadcast: Broadcast,
  cap: number
): Promise<{ sent: number; done: boolean }> {
  const leads = await getSubscribedByAudience(
    broadcast.audience,
    broadcast.filters ?? undefined
  );
  const already = await alreadySentLeadIds(broadcast.id);
  const pending = leads.filter((l) => !already.has(l.id));

  let sent = 0;
  let hitCap = false;
  for (const lead of pending) {
    if (sent >= cap) {
      hitCap = true;
      break;
    }
    try {
      const messageId = await sendMarketingEmail(
        lead,
        broadcast.subject,
        broadcast.body,
        { broadcastId: broadcast.id }
      );
      if (!messageId) {
        // Email not configured mid-run: stop and let a later run retry.
        return { sent, done: false };
      }
      await recordRecipient(broadcast.id, lead.id, { providerMessageId: messageId });
      sent++;
    } catch (err) {
      // Record the failure so we don't retry a bad address forever. It does not
      // count against the rate budget (no message left the building).
      console.error("[broadcast] send failed for", lead.email, err);
      await recordRecipient(broadcast.id, lead.id, {
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }
  // Done when we walked the whole pending list without stopping at the cap.
  return { sent, done: !hitCap };
}

/**
 * Process scheduled broadcasts that are due, metered by the hourly cap and the
 * daytime window. Uses an atomic status claim so overlapping cron runs never
 * double-send. Returns the number of emails actually sent this run.
 */
export async function processDueBroadcasts(): Promise<number> {
  // If email is not configured, leave broadcasts scheduled so they send later.
  if (!emailEnabled()) return 0;
  // Quiet hours: send nothing overnight; due broadcasts wait for the morning.
  if (!isWithinSendWindow()) return 0;

  // Hourly budget shared across all broadcasts.
  let budget = Math.max(0, BROADCAST_HOURLY_CAP - (await sentInLastHour()));
  if (budget <= 0) return 0;

  const due = await getDueBroadcasts();
  let total = 0;

  for (const broadcast of due) {
    if (budget <= 0) break;

    const claimed = await markBroadcastSending(broadcast.id);
    if (!claimed) continue; // another run got it

    const { sent, done } = await sendBatch(broadcast, budget);
    budget -= sent;
    total += sent;

    if (done) {
      await markBroadcastSent(
        broadcast.id,
        await sentCountForBroadcast(broadcast.id)
      );
    } else {
      // More recipients remain (hit the cap): requeue for the next run.
      await requeueBroadcast(broadcast.id);
    }
  }

  return total;
}
