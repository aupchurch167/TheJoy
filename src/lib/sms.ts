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

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { Authorization: key, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [e164], content }),
    });
    if (res.status === 202 || res.ok) return { ok: true };
    let detail = `${res.status}`;
    try {
      const body = await res.json();
      detail = body?.message || body?.error || JSON.stringify(body);
    } catch {
      /* non-JSON error body */
    }
    return { ok: false, error: `Quo error: ${detail}` };
  } catch (err) {
    console.error("[sms] send failed:", err);
    return { ok: false, error: "Could not reach Quo." };
  }
}
