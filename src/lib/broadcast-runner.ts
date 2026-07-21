import { sendMarketingEmail, emailEnabled } from "./email";
import { getSubscribedByAudience } from "./leads";
import {
  getDueBroadcasts,
  markBroadcastSending,
  markBroadcastSent,
  recordRecipient,
  alreadySentLeadIds,
  type Broadcast,
} from "./broadcasts";

/** Send one broadcast to every subscribed lead not already sent. */
async function sendOne(broadcast: Broadcast): Promise<number> {
  const leads = await getSubscribedByAudience(broadcast.audience);
  const already = await alreadySentLeadIds(broadcast.id);
  let count = 0;

  for (const lead of leads) {
    if (already.has(lead.id)) continue;
    try {
      const ok = await sendMarketingEmail(
        lead,
        broadcast.subject,
        broadcast.body
      );
      if (!ok) {
        // Email not configured: stop so we can retry the whole broadcast later.
        return count;
      }
      await recordRecipient(broadcast.id, lead.id);
      count++;
    } catch (err) {
      console.error("[broadcast] send failed for", lead.email, err);
      await recordRecipient(
        broadcast.id,
        lead.id,
        err instanceof Error ? err.message : "unknown"
      );
    }
  }
  return count;
}

/**
 * Process all broadcasts that are scheduled and due. Uses an atomic status
 * claim so overlapping cron runs never double-send. Returns total emails sent.
 */
export async function processDueBroadcasts(): Promise<number> {
  // If email is not configured, leave broadcasts scheduled so they send once
  // it is (rather than marking them sent with zero recipients).
  if (!emailEnabled()) return 0;

  const due = await getDueBroadcasts();
  let total = 0;

  for (const broadcast of due) {
    const claimed = await markBroadcastSending(broadcast.id);
    if (!claimed) continue; // another run got it

    const count = await sendOne(broadcast);
    await markBroadcastSent(broadcast.id, count);
    total += count;
  }

  return total;
}
