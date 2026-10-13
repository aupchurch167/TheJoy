/**
 * The Texts page stores the operator's message and appends this line at send
 * time (see src/app/admin/texts/actions.ts). Drafts keep the same split so a
 * later send does not print the line twice.
 */
export const SMS_OPT_OUT_LINE = "Reply STOP to opt out.";

const TRAILING_OPT_OUT = /(?:\n\s*)?reply stop to opt out\.\s*$/i;

/** Drop a trailing opt-out line so it is stored once, at send time. */
export function stripSmsOptOut(body: string): string {
  return body.trim().replace(TRAILING_OPT_OUT, "").trim();
}

/** The exact text a person would send from the admin, opt-out line included. */
export function smsFullContent(body: string): string {
  return `${stripSmsOptOut(body)}\n\n${SMS_OPT_OUT_LINE}`;
}
