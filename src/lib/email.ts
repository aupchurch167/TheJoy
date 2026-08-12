import { Resend } from "resend";
import { marked } from "marked";
import {
  BUSINESS,
  BUSINESS_ADDRESS_ONE_LINE,
  SITE_URL,
  BADGES,
  MEMORY_CARE,
} from "./site";
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

/** The human-facing unsubscribe page (the visible footer link). */
function unsubscribeUrl(token: string): string {
  return `${SITE_URL}/unsubscribe?token=${token}`;
}

/** The machine one-click unsubscribe endpoint (accepts POST). */
function oneClickUnsubscribeUrl(token: string): string {
  return `${SITE_URL}/api/unsubscribe?token=${token}`;
}

/**
 * List-Unsubscribe headers. Gmail/Yahoo bulk-sender rules want one-click
 * unsubscribe: the header URL must accept a POST, signaled by
 * List-Unsubscribe-Post. Better inbox placement and required at our volume.
 */
function unsubscribeHeaders(token: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${oneClickUnsubscribeUrl(token)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/** The letterhead logo (a live https URL so it loads in recipients' inboxes). */
const EMAIL_LOGO =
  process.env.EMAIL_LOGO_URL ||
  "https://pub-6e43e90472054fe3880f53e8c0ca3b60.r2.dev/blog/logo-65571.png";

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Merge fields. `{{first_name}}` and `{{name}}` are personalized per recipient
 * at send time (from the lead/family contact's name). Unknown names fall back
 * to a warm generic so an email never reads "Dear ,".
 */
export function applyMergeFields(
  text: string,
  contact: { name?: string | null }
): string {
  const full = (contact.name || "").trim();
  const first = full.split(/\s+/)[0] || "";
  return text
    .replace(/\{\{\s*first_name\s*\}\}/gi, first || "friend")
    .replace(/\{\{\s*name\s*\}\}/gi, full || "friend");
}

// A filled CTA button, matching the letter design.
function buttonHtml(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px 0;"><tr><td align="center" bgcolor="#26301f" style="border-radius:4px;"><a href="${escapeAttr(
    url
  )}" style="display:block;padding:15px 34px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:20px;mso-line-height-rule:exactly;color:#fbf9f5;text-decoration:none;border-radius:4px;">${escapeText(
    label
  )}</a></td></tr></table>`;
}

// A centered accent band, for a celebratory line (birthday, holiday, event).
function bannerHtml(text: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:6px 0 24px 0;"><tr><td align="center" bgcolor="#7a8c62" style="padding:16px 24px;border-radius:6px;font-family:Georgia,'Times New Roman',serif;font-size:19px;line-height:26px;mso-line-height-rule:exactly;color:#fbf9f5;letter-spacing:0.03em;">${escapeText(
    text
  )}</td></tr></table>`;
}

// A small ornamental divider between sections.
function dividerHtml(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 22px 0;"><tr><td align="center" style="font-family:Georgia,'Times New Roman',serif;font-size:16px;letter-spacing:10px;color:#b6b09c;">&bull;&nbsp;&bull;&nbsp;&bull;</td></tr></table>`;
}

// Inline styles so the letter typography survives every email client. Applied
// to the Markdown-rendered body. Order matters: blockquotes are handled before
// bare <p> so quote text keeps its larger italic style.
const ST = {
  h1: "margin:0 0 22px 0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:40px;mso-line-height-rule:exactly;font-weight:normal;color:#1f2519;letter-spacing:-0.01em;",
  h2: "margin:26px 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:30px;mso-line-height-rule:exactly;font-weight:normal;color:#1f2519;",
  p: "margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:27px;mso-line-height-rule:exactly;color:#3a4032;",
  a: "color:#5a6b45;text-decoration:underline;",
  bq: "margin:0 0 22px 0;border-left:3px solid #7a8c62;padding-left:20px;",
  bqp: "margin:0 0 10px 0;font-family:Georgia,'Times New Roman',serif;font-size:19px;line-height:31px;mso-line-height-rule:exactly;color:#2c3126;font-style:italic;",
  img: "display:block;border:0;outline:none;width:100%;max-width:504px;height:auto;margin:6px 0 22px 0;",
  hr: "border:0;border-top:1px solid #ddd8cc;margin:26px 0;",
  ul: "margin:0 0 18px 0;padding-left:22px;",
  li: "font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:27px;mso-line-height-rule:exactly;color:#3a4032;margin:0 0 8px 0;",
};

function styleEmailBody(html: string): string {
  let out = html;
  // Blockquotes first (style the quote's inner paragraphs).
  out = out.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (_m, inner) => {
    const styled = inner.replace(/<p>/g, `<p style="${ST.bqp}">`);
    return `<blockquote style="${ST.bq}">${styled}</blockquote>`;
  });
  out = out
    .replace(/<h1>/g, `<h1 style="${ST.h1}">`)
    .replace(/<h2>/g, `<h2 style="${ST.h2}">`)
    .replace(/<h3>/g, `<h3 style="${ST.h2}">`)
    .replace(/<p>/g, `<p style="${ST.p}">`)
    .replace(/<a /g, `<a style="${ST.a}" `)
    .replace(/<img /g, `<img style="${ST.img}" `)
    .replace(/<hr\s*\/?>/g, `<hr style="${ST.hr}">`)
    .replace(/<ul>/g, `<ul style="${ST.ul}">`)
    .replace(/<ol>/g, `<ol style="${ST.ul}">`)
    .replace(/<li>/g, `<li style="${ST.li}">`);
  return out;
}

const SHORTCODE_TOKEN = "JOYSCTOKEN";

/**
 * Expand [[button:Label|url]], [[banner:Text]], and [[divider]] shortcodes to
 * placeholder tokens on the RAW markdown, returning the rewritten markdown plus
 * the HTML each token maps to. This runs BEFORE marked so a bare URL inside a
 * shortcode is never GFM-autolinked (which would break the shortcode and even
 * swallow the closing `]]`). The tokens are plain text marked leaves untouched.
 */
function extractShortcodes(md: string): { md: string; parts: string[] } {
  const parts: string[] = [];
  const token = () => `${SHORTCODE_TOKEN}${parts.length - 1}X`;
  const out = (md || "")
    .replace(/\[\[button:([^|\]]+)\|([^\]]+)\]\]/g, (_m, label, url) => {
      parts.push(buttonHtml(String(label).trim(), String(url).trim()));
      return token();
    })
    .replace(/\[\[banner:([^\]]+)\]\]/g, (_m, text) => {
      parts.push(bannerHtml(String(text).trim()));
      return token();
    })
    .replace(/\[\[divider\]\]/g, () => {
      parts.push(dividerHtml());
      return token();
    });
  return { md: out, parts };
}

/** Render Markdown to the styled inner HTML used inside the branded shell. */
function renderBody(markdownBody: string): string {
  // Pull shortcodes out first (so their URLs survive marked's autolinker).
  const { md, parts } = extractShortcodes(markdownBody || "");
  // breaks:true so a single newline is a line break (email authors expect the
  // signature and address blocks they type on separate lines to stay stacked).
  let html = styleEmailBody(
    marked.parse(md, { async: false, breaks: true }) as string
  );
  // Swap the block-level shortcode HTML back in, stripping the <p> marked wraps
  // a lone token in, then any inline occurrences.
  html = html
    .replace(
      new RegExp(`<p[^>]*>\\s*${SHORTCODE_TOKEN}(\\d+)X\\s*</p>`, "g"),
      (_m, i) => parts[Number(i)] ?? ""
    )
    .replace(
      new RegExp(`${SHORTCODE_TOKEN}(\\d+)X`, "g"),
      (_m, i) => parts[Number(i)] ?? ""
    );
  return html;
}

/**
 * The Joy letter shell: a warm, Georgia-serif branded template (letterhead,
 * body, award badges, footer with the unsubscribe link). The Markdown body
 * flows into the letter area; greeting, headline, photo, quote, CTA button, and
 * sign-off all come from the message content (see lib/email-templates.ts).
 */
function wrapEmail(
  innerHtml: string,
  unsubUrl?: string,
  showBadges = true
): string {
  const badges = BADGES.filter(
    (b) => !b.requiresMemoryCare || MEMORY_CARE.enabled
  )
    .map(
      (b, i) =>
        `<img src="${SITE_URL}${b.src}" width="66" alt="${escapeAttr(
          b.alt
        )}" style="border:0;outline:none;width:66px;height:auto;vertical-align:middle;${i > 0 ? "padding-left:14px;" : ""}">`
    )
    .join("");

  // The award-badge strip is optional. Transactional emails (e.g. a deposit
  // request) hide it; when hidden, the footer takes the divider so there is
  // still a clean line above the address block.
  const badgesRow = showBadges
    ? `  <tr><td class="pad" style="padding:34px 48px 0 48px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #ddd8cc;"><tr><td align="left" style="padding-top:22px;">
      ${badges}
    </td></tr></table>
  </td></tr>`
    : "";
  const footerBorder = showBadges ? "" : "border-top:1px solid #ddd8cc;";

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<style type="text/css">
@media only screen and (max-width:620px){
  .wrap{width:100% !important;}
  .pad{padding-left:24px !important;padding-right:24px !important;}
}
</style></head>
<body style="margin:0;padding:0;background-color:#efece5;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#efece5;">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="wrap" style="width:600px;max-width:600px;background-color:#fbf9f5;">

  <tr><td class="pad" style="padding:36px 48px 0 48px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td align="left">
        <img src="${EMAIL_LOGO}" width="132" alt="${escapeAttr(BUSINESS.name)}" style="display:block;border:0;outline:none;width:132px;max-width:132px;height:auto;">
      </td>
      <td align="right" style="font-family:Georgia,'Times New Roman',serif;font-size:12px;line-height:18px;mso-line-height-rule:exactly;color:#7c7a6f;">Loganville, Georgia</td>
    </tr></table>
  </td></tr>

  <tr><td class="pad" style="padding:22px 48px 0 48px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td height="1" style="height:1px;line-height:1px;font-size:0;background-color:#ddd8cc;">&nbsp;</td></tr></table>
  </td></tr>

  <tr><td class="pad" style="padding:34px 48px 0 48px;">
    ${innerHtml}
  </td></tr>

${badgesRow}

  <tr><td class="pad" style="padding:28px 48px 40px 48px;${footerBorder}">
    <p style="margin:0 0 6px 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:22px;mso-line-height-rule:exactly;color:#6f6d62;">
      ${escapeText(BUSINESS.name)} &middot; <a href="https://maps.google.com/?q=${encodeURIComponent(
        `${BUSINESS.name} ${BUSINESS_ADDRESS_ONE_LINE}`
      )}" style="color:#5a6b45;text-decoration:underline;">${escapeText(BUSINESS_ADDRESS_ONE_LINE)}</a><br>
      <a href="${BUSINESS.phoneHref}" style="color:#5a6b45;text-decoration:underline;">${escapeText(BUSINESS.phone)}</a> &middot; <a href="${BUSINESS.emailHref}" style="color:#5a6b45;text-decoration:underline;">${escapeText(BUSINESS.email)}</a>
    </p>
    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:11px;line-height:19px;mso-line-height-rule:exactly;color:#9a988c;">
      ${
        unsubUrl
          ? `Licensed as a personal care home in the State of Georgia. You are receiving this because you contacted us about Joy. <a href="${unsubUrl}" style="color:#9a988c;text-decoration:underline;">Unsubscribe</a>.`
          : `Licensed as a personal care home in the State of Georgia. Questions about this message? Just reply to this email or call ${escapeText(BUSINESS.phone)}.`
      }
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

/**
 * Send one marketing email to a lead. Applies merge fields, renders the
 * Markdown body to styled HTML, wraps it in the Joy letter shell, and ALWAYS
 * includes an unsubscribe link + the List-Unsubscribe header. No-ops (returns
 * false) when email is not configured.
 */
export async function sendMarketingEmail(
  lead: Lead,
  subject: string,
  markdownBody: string,
  opts?: { broadcastId?: string }
): Promise<string | null> {
  if (!resend) {
    console.info("[email] RESEND_API_KEY not set; skipping send to", lead.email);
    return null;
  }
  // Phone-only family contacts have no email; nothing to send.
  if (!lead.email) return null;
  const subj = applyMergeFields(subject, lead);
  const inner = renderBody(applyMergeFields(markdownBody, lead));

  const { data } = await resend.emails.send({
    from: FROM,
    to: lead.email,
    subject: subj,
    html: wrapEmail(inner, unsubscribeUrl(lead.unsubscribe_token)),
    headers: unsubscribeHeaders(lead.unsubscribe_token),
    ...(opts?.broadcastId
      ? { tags: [{ name: "broadcast_id", value: opts.broadcastId }] }
      : {}),
  });
  // Returns Resend's message id so the caller can match webhook events to it.
  return data?.id ?? null;
}

/**
 * Send a TEST copy to one address, rendered exactly like the real send (same
 * shell, same Markdown->HTML). Merge fields fill with a sample name so the
 * greeting reads naturally. The subject is prefixed [TEST] and the unsubscribe
 * link uses a harmless preview token, so a test can never unsubscribe anyone.
 */
export async function sendTestEmail(
  to: string,
  subject: string,
  markdownBody: string
): Promise<boolean> {
  if (!resend) {
    console.info("[email] RESEND_API_KEY not set; test send skipped.");
    return false;
  }
  const sample = { name: "Sarah" };
  const subj = applyMergeFields(subject, sample);
  const inner = renderBody(applyMergeFields(markdownBody || "", sample));

  await resend.emails.send({
    from: FROM,
    to,
    subject: `[TEST] ${subj}`,
    html: wrapEmail(inner, unsubscribeUrl("test-preview")),
    headers: unsubscribeHeaders("test-preview"),
  });
  return true;
}

/**
 * Family feedback survey invitation. Personal and short (spec §Emails), signed
 * from Mellissa, with a single button to the tokenized survey. Transactional
 * (a specific family we already work with), so no marketing unsubscribe footer.
 */
export async function sendSurveyInvitation(request: {
  family_name: string;
  family_email: string;
  resident_first_name: string | null;
  token: string;
}): Promise<boolean> {
  if (!resend) {
    console.info("[email] RESEND_API_KEY not set; survey invite skipped.");
    return false;
  }
  const url = `${SITE_URL}/feedback/${request.token}`;
  const who = request.resident_first_name
    ? `${request.resident_first_name}`
    : "your family";
  const firstName = request.family_name.trim().split(/\s+/)[0] || "there";
  const body = [
    `Hi ${firstName},`,
    ``,
    `How are things going for ${who} at Joy? I would love to hear, the good and anything we could do better.`,
    ``,
    `It takes about two minutes.`,
    ``,
    `[[button:Share how it is going|${url}]]`,
    ``,
    `Thank you,`,
    `Mellissa`,
  ].join("\n");

  await resend.emails.send({
    from: FROM,
    to: request.family_email,
    subject: "How are things going?",
    html: wrapEmail(renderBody(body), undefined, false),
  });
  return true;
}

/**
 * Internal alert when a family flags a concern (rating 3 or below). Sent to the
 * feedback_alert_emails recipients. Respects anonymity: an anonymous response
 * shows as "Anonymous" and never reveals which family it came from. Fired on
 * low-rating submit and again on a callback request (with contact details).
 */
export async function sendConcernAlert(input: {
  to: string[];
  familyLabel: string; // family name, or "Anonymous"
  rating: number;
  goingWell?: string | null;
  couldBeBetter?: string | null;
  suggestions?: string | null;
  callback?: { name: string; phone: string; preferredTime?: string | null };
}): Promise<boolean> {
  if (!resend) {
    console.info("[email] RESEND_API_KEY not set; concern alert skipped.");
    return false;
  }
  const to = input.to.map((e) => e.trim()).filter(Boolean);
  if (!to.length) return false;

  const lines: string[] = [
    `**Family concern flagged**`,
    ``,
    `From: ${input.familyLabel}`,
    `Rating: ${input.rating} of 5`,
  ];
  if (input.goingWell) lines.push(``, `Going well:`, input.goingWell);
  if (input.couldBeBetter)
    lines.push(``, `Could be better:`, input.couldBeBetter);
  if (input.suggestions) lines.push(``, `Suggestions:`, input.suggestions);
  if (input.callback) {
    lines.push(
      ``,
      `[[divider]]`,
      `**Callback requested**`,
      `Name: ${input.callback.name}`,
      `Phone: ${input.callback.phone}`
    );
    if (input.callback.preferredTime)
      lines.push(`Preferred time: ${input.callback.preferredTime}`);
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Family concern flagged: ${input.familyLabel}`,
    html: wrapEmail(renderBody(lines.join("\n")), undefined, false),
  });
  return true;
}

/**
 * Send a deposit request from hello@joyseniorcare.com (via Resend), carrying
 * the PayPal-hosted payment link. This is transactional (a specific family, a
 * specific amount), so the letter shell renders WITHOUT the marketing
 * unsubscribe footer, and replies go to the business inbox. No-ops (returns
 * false) when email is not configured.
 */
export async function sendDepositEmail(input: {
  to: string;
  name: string;
  amountFormatted: string; // e.g. "$500.00"
  payUrl: string;
  note?: string | null;
  reminder?: boolean; // softer "friendly reminder" wording
}): Promise<boolean> {
  if (!resend) {
    console.info("[email] RESEND_API_KEY not set; deposit email skipped.");
    return false;
  }
  const first = (input.name || "").trim().split(/\s+/)[0] || "there";
  const note = (input.note || "").trim();

  const opening = input.reminder
    ? `Just a friendly reminder about the move-in deposit of ${input.amountFormatted} to reserve the room.`
    : `Thank you for choosing Joy. To reserve the room, we are requesting a move-in deposit of ${input.amountFormatted}.`;

  // Joy voice (§2): short sentences, no em-dashes (parentheses for asides), no
  // banned words, Mellissa named where care/help is offered.
  const bodyMd = [
    `Hi ${first},`,
    ``,
    opening,
    ...(note ? [``, note] : []),
    ``,
    `You can pay securely below (it goes through PayPal, and any card works, no PayPal account needed).`,
    ``,
    `[[button:Pay the deposit|${input.payUrl}]]`,
    ``,
    `If the button does not open, here is the link: ${input.payUrl}`,
    ``,
    `Any questions, just reply to this email or call us at ${BUSINESS.phone}. Mellissa and the team are glad to help.`,
    ``,
    `Warmly,`,
    `The Joy Senior Living team`,
  ].join("\n");

  await resend.emails.send({
    from: FROM,
    to: input.to,
    replyTo: BUSINESS.email,
    subject: input.reminder
      ? `A reminder about your deposit request from ${BUSINESS.name}`
      : `Your deposit request from ${BUSINESS.name}`,
    // Transactional: no marketing unsubscribe footer, no award badges.
    html: wrapEmail(renderBody(bodyMd), undefined, false),
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
