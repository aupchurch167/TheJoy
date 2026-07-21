import { Resend } from "resend";
import { BUSINESS, SITE_URL } from "./site";
import type { Lead } from "./leads";

/**
 * Outbound email via Resend. Everything here is OPTIONAL: if RESEND_API_KEY
 * is not set, these functions log and no-op so the site keeps working before
 * email is configured.
 *
 * Env vars:
 *   RESEND_API_KEY     from resend.com
 *   EMAIL_FROM         e.g. "Joy Senior Living <hello@joyseniorcare.com>"
 *                      (must be a verified sending domain in Resend)
 *   LEAD_NOTIFY_TO     where new-lead alerts go (e.g. Adam + Mellissa)
 */

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM =
  process.env.EMAIL_FROM || `${BUSINESS.name} <${BUSINESS.email}>`;

export function emailEnabled(): boolean {
  return resend !== null;
}

/** Confirmation to the family, with an unsubscribe link (required on all sends). */
export async function sendLeadWelcome(lead: Lead): Promise<void> {
  if (!resend) {
    console.info("[email] RESEND_API_KEY not set; skipping welcome email.");
    return;
  }
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${lead.unsubscribe_token}`;

  await resend.emails.send({
    from: FROM,
    to: lead.email,
    subject: `Thank you for reaching out to ${BUSINESS.name}`,
    text: [
      `Hi ${lead.name.split(" ")[0] || "there"},`,
      "",
      `Thank you for reaching out to ${BUSINESS.name}. Someone here will get back to you soon.`,
      "",
      `If you would like to talk sooner, you can call us at ${BUSINESS.phone}.`,
      "",
      `Warmly,`,
      `${BUSINESS.director.name}, ${BUSINESS.director.title}`,
      `${BUSINESS.name}`,
      "",
      `If you did not mean to contact us, you can unsubscribe here: ${unsubscribeUrl}`,
    ].join("\n"),
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
    },
  });
}

/** Internal alert so Adam/Mellissa see a new lead right away. */
export async function notifyNewLead(lead: Lead): Promise<void> {
  const to = process.env.LEAD_NOTIFY_TO;
  if (!resend || !to) {
    console.info("[email] Lead notification skipped (no key or LEAD_NOTIFY_TO).");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to: to.split(",").map((s) => s.trim()),
    subject: `New tour inquiry: ${lead.name}`,
    text: [
      `New lead from the website (source: ${lead.source}).`,
      "",
      `Name:  ${lead.name}`,
      `Email: ${lead.email}`,
      `Phone: ${lead.phone || "(not given)"}`,
      "",
      `Message:`,
      lead.message || "(none)",
    ].join("\n"),
  });
}
