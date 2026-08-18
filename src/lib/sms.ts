/**
 * SMS sending via Quo (formerly OpenPhone). Env-gated: no-ops until a key and a
 * sending number are configured, so nothing texts by accident.
 *
 *   QUO_API_KEY        Quo/OpenPhone API key (Authorization header, raw value)
 *   QUO_FROM_NUMBER    the Quo number to send from, E.164 (e.g. +14706843569)
 *
 * API: POST https://api.openphone.com/v1/messages
 *      headers: { Authorization: <API_KEY>, Content-Type: application/json }
 *      body:    { from, to: ["+1..."], content }   -> 202 on success
 * Numbers must be E.164. (Aliases OPENPHONE_* are also accepted.)
 */

// Default to Quo's (OpenPhone's) API; overridable for testing/self-hosting.
const API_URL =
  process.env.QUO_API_URL || "https://api.openphone.com/v1/messages";

function apiKey(): string | undefined {
  return process.env.QUO_API_KEY || process.env.OPENPHONE_API_KEY;
}
function fromNumber(): string | undefined {
  return process.env.QUO_FROM_NUMBER || process.env.OPENPHONE_FROM_NUMBER;
}

export function smsEnabled(): boolean {
  return !!(apiKey() && fromNumber());
}

/** Normalize a US phone to E.164 (+1XXXXXXXXXX). Returns null if not valid. */
export function toE164(phone?: string | null): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (/^\+\d{8,15}$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/** Parse a comma/newline list of phone numbers to unique E.164, dropping invalid. */
export function parseSmsNumbers(raw?: string | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,\n]/)) {
    const e164 = toE164(part.trim());
    if (e164 && !seen.has(e164)) {
      seen.add(e164);
      out.push(e164);
    }
  }
  return out;
}

export type SmsResult = { ok: boolean; error?: string };

/** Send one SMS. Returns ok:false with a reason instead of throwing. */
export async function sendSms(to: string, content: string): Promise<SmsResult> {
  const key = apiKey();
  const fromRaw = fromNumber();
  if (!key || !fromRaw) return { ok: false, error: "SMS is not configured." };

  // Quo accepts `from` as E.164 (+1...) OR a phone-number id (PN...). Normalize
  // a plain/formatted number to E.164; pass a PN id through untouched.
  const from = fromRaw.startsWith("PN") ? fromRaw : toE164(fromRaw);
  if (!from) {
    return {
      ok: false,
      error:
        "QUO_FROM_NUMBER is not valid. Use full E.164 like +14706843569 (or the Quo phone-number id starting with PN).",
    };
  }

  const e164 = toE164(to);
  if (!e164) return { ok: false, error: "Invalid phone number." };

  const payload = JSON.stringify({ from, to: [e164], content });
  // Quo/OpenPhone occasionally returns a transient gateway error (502/503/504)
  // or a timeout that has nothing to do with your setup. Retry those a couple
  // of times with a short backoff before giving up; never retry a 4xx (that is
  // a real config/permission/rate problem the operator must fix).
  const MAX_ATTEMPTS = 3;
  let lastTransient = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      let res: Response;
      try {
        res = await fetch(API_URL, {
          method: "POST",
          headers: { Authorization: key, "Content-Type": "application/json" },
          body: payload,
          signal: ctrl.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (res.status === 202 || res.ok) return { ok: true };

      // Read the error body once (Quo's own message helps for 4xx).
      let detail = "";
      try {
        const body = await res.json();
        detail = body?.message || body?.error || JSON.stringify(body);
      } catch {
        /* non-JSON error body */
      }

      if (res.status >= 500) {
        lastTransient = `Quo is temporarily unavailable (${res.status}${
          detail ? `: ${detail}` : ""
        }). This is on Quo's side, not your setup.`;
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, attempt * 800));
          continue;
        }
        return { ok: false, error: lastTransient };
      }

      // 4xx: a real problem (auth, unregistered/incapable number, rate limit).
      const hint =
        res.status === 429
          ? " (rate limited: too many texts too fast)"
          : res.status === 401 || res.status === 403
            ? " (check QUO_API_KEY and that the number is enabled for A2P texting)"
            : "";
      return { ok: false, error: `Quo error ${res.status}${hint}: ${detail || "no detail"}` };
    } catch (err) {
      // Network failure or 15s timeout: transient, worth a retry.
      lastTransient =
        err instanceof Error && err.name === "AbortError"
          ? "Quo did not respond in time (timed out)."
          : "Could not reach Quo (network error).";
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, attempt * 800));
        continue;
      }
      console.error("[sms] send failed:", err);
      return { ok: false, error: lastTransient };
    }
  }
  return { ok: false, error: lastTransient || "Could not send the text." };
}

/**
 * The exact body of a feedback-survey text. Pure (no network), so the admin can
 * preview the wording before sending. Short, plain, from Joy Senior Living (a
 * personal care home), with the required opt-out line.
 */
export function surveyTextBody(input: {
  familyName: string;
  residentFirstName?: string | null;
  url: string;
}): string {
  const first = input.familyName.trim().split(/\s+/)[0] || "there";
  const who = input.residentFirstName?.trim() || "your family member";
  return (
    `Hi ${first}, it is the team at Joy Senior Living. We would love to know how things are going with ${who}. ` +
    `This quick survey takes about two minutes (you can answer anonymously): ${input.url}` +
    `\n\nReply STOP to opt out.`
  );
}

/**
 * Text a family the feedback-survey link. `url` is the tokenized survey link so
 * the text works with no email attached.
 */
export async function sendSurveyText(input: {
  toPhone: string;
  familyName: string;
  residentFirstName?: string | null;
  url: string;
}): Promise<SmsResult> {
  return sendSms(input.toPhone, surveyTextBody(input));
}
