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

function unsubscribeUrl(token: string): string {
  return `${SITE_URL}/unsubscribe?token=${token}`;
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
  // Shortcodes. Each also strips the <p> marked wrapped a lone shortcode in.
  // [[button:Label|https://…]] -> filled CTA button
  out = out.replace(
    /<p[^>]*>\s*\[\[button:([^|\]]+)\|([^\]]+)\]\]\s*<\/p>/g,
    (_m, label, url) => buttonHtml(String(label).trim(), String(url).trim())
  );
  out = out.replace(
    /\[\[button:([^|\]]+)\|([^\]]+)\]\]/g,
    (_m, label, url) => buttonHtml(String(label).trim(), String(url).trim())
  );
  // [[banner:Text]] -> centered accent band
  out = out.replace(
    /<p[^>]*>\s*\[\[banner:([^\]]+)\]\]\s*<\/p>/g,
    (_m, text) => bannerHtml(String(text).trim())
  );
  out = out.replace(/\[\[banner:([^\]]+)\]\]/g, (_m, text) =>
    bannerHtml(String(text).trim())
  );
  // [[divider]] -> ornamental divider
  out = out.replace(/<p[^>]*>\s*\[\[divider\]\]\s*<\/p>/g, () => dividerHtml());
  out = out.replace(/\[\[divider\]\]/g, () => dividerHtml());
  return out;
}

/** Render Markdown to the styled inner HTML used inside the branded shell. */
function renderBody(markdownBody: string): string {
  // breaks:true so a single newline is a line break (email authors expect the
  // signature and address blocks they type on separate lines to stay stacked).
  return styleEmailBody(
    marked.parse(markdownBody || "", { async: false, breaks: true }) as string
  );
}

/**
 * The Joy letter shell: a warm, Georgia-serif branded template (letterhead,
 * body, award badges, footer with the unsubscribe link). The Markdown body
 * flows into the letter area; greeting, headline, photo, quote, CTA button, and
 * sign-off all come from the message content (see lib/email-templates.ts).
 */
function wrapEmail(innerHtml: string, unsubUrl: string): string {
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

  <tr><td class="pad" style="padding:34px 48px 0 48px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #ddd8cc;"><tr><td align="left" style="padding-top:22px;">
      ${badges}
    </td></tr></table>
  </td></tr>

  <tr><td class="pad" style="padding:28px 48px 40px 48px;">
    <p style="margin:0 0 6px 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:22px;mso-line-height-rule:exactly;color:#6f6d62;">
      ${escapeText(BUSINESS.name)} &middot; <a href="https://maps.google.com/?q=${encodeURIComponent(
        `${BUSINESS.name} ${BUSINESS_ADDRESS_ONE_LINE}`
      )}" style="color:#5a6b45;text-decoration:underline;">${escapeText(BUSINESS_ADDRESS_ONE_LINE)}</a><br>
      <a href="${BUSINESS.phoneHref}" style="color:#5a6b45;text-decoration:underline;">${escapeText(BUSINESS.phone)}</a> &middot; <a href="${BUSINESS.emailHref}" style="color:#5a6b45;text-decoration:underline;">${escapeText(BUSINESS.email)}</a>
    </p>
    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:11px;line-height:19px;mso-line-height-rule:exactly;color:#9a988c;">
      Licensed as a personal care home in the State of Georgia. You are receiving this because you contacted us about Joy. <a href="${unsubUrl}" style="color:#9a988c;text-decoration:underline;">Unsubscribe</a>.
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
  markdownBody: string
): Promise<boolean> {
  if (!resend) {
    console.info("[email] RESEND_API_KEY not set; skipping send to", lead.email);
    return false;
  }
  // Phone-only family contacts have no email; nothing to send.
  if (!lead.email) return false;
  const unsubUrl = unsubscribeUrl(lead.unsubscribe_token);
  const subj = applyMergeFields(subject, lead);
  const inner = renderBody(applyMergeFields(markdownBody, lead));

  await resend.emails.send({
    from: FROM,
    to: lead.email,
    subject: subj,
    html: wrapEmail(inner, unsubUrl),
    headers: { "List-Unsubscribe": `<${unsubUrl}>` },
  });
  return true;
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
  const unsubUrl = unsubscribeUrl("test-preview");
  const subj = applyMergeFields(subject, sample);
  const inner = renderBody(applyMergeFields(markdownBody || "", sample));

  await resend.emails.send({
    from: FROM,
    to,
    subject: `[TEST] ${subj}`,
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
