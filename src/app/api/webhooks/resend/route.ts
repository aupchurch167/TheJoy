import { createHmac, timingSafeEqual } from "node:crypto";
import { hasDatabase } from "@/lib/db";
import {
  applyEngagementEvent,
  type EngagementEvent,
} from "@/lib/broadcasts";
import { suppressLeadByEmail } from "@/lib/leads";
import { suppressEmail } from "@/lib/suppression";

/**
 * Resend webhook: delivery + engagement events.
 *  - email.bounced / email.complained  -> suppress the address (never email it
 *    again) and stamp the recipient row.
 *  - email.delivered / .opened / .clicked -> stamp the recipient row (powers
 *    the per-broadcast results view).
 * Events are matched to a recipient by Resend's message id (stored at send).
 *
 * Requests are verified with the Svix signature scheme (Resend uses Svix).
 * Set RESEND_WEBHOOK_SECRET (the "whsec_..." signing secret from the Resend
 * webhook settings). Without it we cannot trust the payload, so we acknowledge
 * (200) but do nothing — configure the secret to turn processing on.
 */

export const dynamic = "force-dynamic";

const EVENT_MAP: Record<string, EngagementEvent> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

/** Verify the Svix signature over the raw body. */
function verify(
  secret: string,
  body: string,
  headers: Headers
): boolean {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const sigHeader = headers.get("svix-signature");
  if (!id || !timestamp || !sigHeader) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signed = `${id}.${timestamp}.${body}`;
  const expected = createHmac("sha256", secretBytes)
    .update(signed)
    .digest("base64");
  const expectedBuf = Buffer.from(expected);

  // The header is a space-separated list of "v1,<base64sig>" entries.
  return sigHeader.split(" ").some((part) => {
    const sig = part.split(",")[1];
    if (!sig) return false;
    const buf = Buffer.from(sig);
    return buf.length === expectedBuf.length && timingSafeEqual(buf, expectedBuf);
  });
}

function emailsOf(to: unknown): string[] {
  if (Array.isArray(to)) return to.filter((x): x is string => typeof x === "string");
  if (typeof to === "string") return [to];
  return [];
}

export async function POST(req: Request): Promise<Response> {
  const raw = await req.text();

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[resend-webhook] RESEND_WEBHOOK_SECRET not set; ignoring event.");
    return new Response("ok", { status: 200 });
  }
  if (!verify(secret, raw, req.headers)) {
    return new Response("invalid signature", { status: 401 });
  }
  if (!hasDatabase()) return new Response("ok", { status: 200 });

  let payload: { type?: string; data?: Record<string, unknown> };
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("bad payload", { status: 400 });
  }

  const type = payload.type ?? "";
  const data = payload.data ?? {};
  const event = EVENT_MAP[type];
  if (!event) return new Response("ok", { status: 200 }); // ignore other types

  try {
    const messageId =
      (data.email_id as string) || (data.id as string) || "";
    if (messageId) await applyEngagementEvent(messageId, event);

    // Hard bounce or spam complaint: stop emailing this address for good. Add
    // it to the suppression list (never emailed again, no override) and mark
    // any matching lead unsubscribed.
    if (event === "bounced" || event === "complained") {
      const reason = event === "bounced" ? "bounce" : "complaint";
      for (const email of emailsOf(data.to)) {
        await suppressEmail(email, reason, { note: `Resend ${event}` });
        const n = await suppressLeadByEmail(email);
        if (n > 0) console.info(`[resend-webhook] suppressed ${email} (${event})`);
      }
    }
  } catch (err) {
    console.error("[resend-webhook] processing failed", err);
    // Still 200 so Resend does not retry-storm; the miss is logged.
  }

  return new Response("ok", { status: 200 });
}
