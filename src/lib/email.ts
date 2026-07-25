import { Resend } from "resend";
import { marked } from "marked";
import { BUSINESS, BUSINESS_ADDRESS_ONE_LINE, SITE_URL } from "./site";
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

const FROM = process.env.EMAIL_FROM || `${BUSINESS.name} <${BUSINESS.email}>`;

export function emailEnabled(): boolean {
  return resend !== null;
}

function unsubscribeUrl(token: string): string {
  return `${SITE_URL}/unsubscribe?token=${token}`;
}

/** Wrap rendered content in a simple, warm, branded HTML shell. */
function wrapEmail(innerHtml: string, unsubUrl: string): string {
  return `<!doctype html><html><body style="margin:0;background:#fbf6ee;padding:24px 0;font-family:Georgia,'Times New Roman',serif;color:#2b2620;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e6ddcd;border-radius:12px;overflow:hidden;">
      <tr><td style="padding:24px 32px 8px;border-bottom:1px solid #e6ddcd;">
        <div style="font-size:20px;font-weight:600;color:#2b2620;">${BUSINESS.name}</div>
        <div style="font-size:12px;color:#8a8072;">Loganville, Georgia</div>
      </td></tr>
      <tr><td style="padding:24px 32px;font-size:16px;line-height:1.7;color:#5c5347;">
        ${innerHtml}
      </td></tr>
      <tr><td style="padding:16px 32px 28px;border-top:1px solid #e6ddcd;font-size:12px;color:#8a8072;line-height:1.6;">
        ${BUSINESS.name} (a personal care home), ${BUSINESS_ADDRESS_ONE_LINE}. ${BUSINESS.phone}.<br/>
        You are receiving this because you contacted us. <a href="${unsubUrl}" style="color:#b0532b;">Unsubscribe</a>.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

/**
 * Send one marketing email to a lead. Renders the Markdown body to HTML, wraps
 * it in the branded shell, and ALWAYS includes an unsubscribe link + the
 * List-Unsubscribe header. No-ops (returns false) when email is not configured.
 */
export async function sendMarketingEmail(
  lead: Lead,
  subject: string,
  markdownBody: string
): Promise<boolean> {
  if (!resend) {
    console.info("[email] RESEND_API_KEY not set; skipping send to", lead.email);
    return false;
  }
  // Phone-only family contacts have no email; nothing to send.
  if (!lead.email) return false;
  const unsubUrl = unsubscribeUrl(lead.unsubscribe_token);
  const inner = marked.parse(markdownBody, { async: false }) as string;

  await resend.emails.send({
    from: FROM,
    to: lead.email,
    subject,
    html: wrapEmail(inner, unsubUrl),
    headers: { "List-Unsubscribe": `<${unsubUrl}>` },
  });
  return true;
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
