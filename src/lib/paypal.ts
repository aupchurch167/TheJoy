/**
 * PayPal Invoicing (v2) client. Sends a deposit request as a PayPal-hosted
 * invoice: PayPal emails the family, hosts the secure payment page, tracks
 * paid/unpaid, and (if enabled on the account) sends reminders. We keep only a
 * local record for the Deposits screen; PayPal owns the money flow.
 *
 * Everything here is OPTIONAL and env-gated, matching the rest of this codebase
 * (email, SMS, storage): with no PayPal credentials the functions report "not
 * configured" and the Deposits screen shows a setup notice instead of crashing.
 *
 * No SDK: the REST calls are thin fetch() wrappers.
 *
 * Env vars:
 *   PAYPAL_CLIENT_ID       from developer.paypal.com (a REST app's client id)
 *   PAYPAL_CLIENT_SECRET   that app's secret
 *   PAYPAL_ENV             "sandbox" (default) or "live"
 *   PAYPAL_WEBHOOK_ID      (optional) verifies /api/webhooks/paypal callbacks
 */

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

/** True once both PayPal credentials are set. */
export function paypalEnabled(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

/** "live" only when explicitly opted in; otherwise the safe sandbox default. */
export function paypalMode(): "sandbox" | "live" {
  return process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
}

function apiBase(): string {
  return paypalMode() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

/* ------------------------------------------------------------------ */
/* Auth (client-credentials token, cached until shortly before expiry) */
/* ------------------------------------------------------------------ */

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("PayPal is not configured.");
  }
  const now = Date.now();
  // Reuse the token while >60s of life remains (tokens last ~9 hours).
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.value;
  }
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `PayPal auth failed (${res.status}). Check PAYPAL_CLIENT_ID/SECRET and PAYPAL_ENV. ${text.slice(0, 200)}`
    );
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: json.access_token,
    expiresAt: now + (json.expires_in || 3000) * 1000,
  };
  return json.access_token;
}

/* ------------------------------------------------------------------ */
/* Invoices                                                            */
/* ------------------------------------------------------------------ */

export type PayPalInvoice = {
  id: string;
  status: string;
  recipientViewUrl?: string;
  amountValue?: string;
  currency?: string;
};

/** The invoice id is the last path segment of the create/send `href`. */
function parseIdFromHref(href?: string): string | undefined {
  if (!href) return undefined;
  const parts = href.split("/").filter(Boolean);
  return parts[parts.length - 1] || undefined;
}

/** Ask PayPal for the next sequential invoice number (best-effort). */
async function generateInvoiceNumber(
  token: string,
  base: string
): Promise<string | undefined> {
  try {
    const res = await fetch(`${base}/v2/invoicing/generate-next-invoice-number`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return undefined;
    const j = (await res.json()) as { invoice_number?: string };
    return j.invoice_number;
  } catch {
    return undefined;
  }
}

/**
 * Create a draft deposit invoice and immediately send it, so PayPal emails the
 * recipient a hosted invoice. Returns the invoice id, status, the payer-facing
 * URL, and the assigned invoice number.
 */
export async function createAndSendDepositInvoice(input: {
  name: string;
  email: string;
  amountValue: string; // e.g. "500.00"
  currency?: string; // default USD
  itemName?: string; // default "Move-in deposit"
  note?: string; // shown to the recipient on the invoice
}): Promise<{
  id: string;
  status: string;
  recipientViewUrl?: string;
  invoiceNumber?: string;
}> {
  const token = await getAccessToken();
  const base = apiBase();
  const currency = input.currency || "USD";

  const trimmedName = input.name.trim();
  const [given, ...rest] = trimmedName.split(/\s+/);
  const surname = rest.join(" ");

  const invoiceNumber = await generateInvoiceNumber(token, base);

  const body = {
    detail: {
      currency_code: currency,
      ...(invoiceNumber ? { invoice_number: invoiceNumber } : {}),
      ...(input.note ? { note: input.note } : {}),
    },
    primary_recipients: [
      {
        billing_info: {
          name: {
            given_name: given || trimmedName,
            ...(surname ? { surname } : {}),
          },
          email_address: input.email.trim(),
        },
      },
    ],
    items: [
      {
        name: input.itemName || "Move-in deposit",
        quantity: "1",
        unit_amount: { currency_code: currency, value: input.amountValue },
      },
    ],
  };

  const createRes = await fetch(`${base}/v2/invoicing/invoices`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!createRes.ok) {
    const text = await createRes.text().catch(() => "");
    throw new Error(
      `PayPal could not create the invoice (${createRes.status}). ${text.slice(0, 300)}`
    );
  }
  const created = (await createRes.json()) as { href?: string; id?: string };
  const invoiceId = created.id || parseIdFromHref(created.href);
  if (!invoiceId) throw new Error("PayPal did not return an invoice id.");

  // Send with send_to_recipient:false — this transitions the invoice to SENT
  // (so it is payable and a recipient_view_url is generated) but PayPal does
  // NOT email the recipient. We email the payment link ourselves from
  // hello@joyseniorcare.com via Resend, for a branded, reliable delivery.
  const sendRes = await fetch(
    `${base}/v2/invoicing/invoices/${invoiceId}/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ send_to_recipient: false }),
      cache: "no-store",
    }
  );
  if (!sendRes.ok) {
    const text = await sendRes.text().catch(() => "");
    throw new Error(
      `The invoice was created but PayPal could not finalize it (${sendRes.status}). ${text.slice(0, 300)}`
    );
  }

  // Read it back for the authoritative status + the payer-facing URL.
  let status = "SENT";
  let recipientViewUrl: string | undefined;
  try {
    const invoice = await getInvoice(invoiceId, token);
    status = invoice.status || status;
    recipientViewUrl = invoice.recipientViewUrl;
  } catch {
    // Non-fatal: the invoice is sent; we just could not read it back yet.
  }

  return { id: invoiceId, status, recipientViewUrl, invoiceNumber };
}

/** Fetch a single invoice's current status + payer URL for reconciliation. */
export async function getInvoice(
  invoiceId: string,
  tokenArg?: string
): Promise<PayPalInvoice> {
  const token = tokenArg || (await getAccessToken());
  const res = await fetch(`${apiBase()}/v2/invoicing/invoices/${invoiceId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `PayPal could not read invoice ${invoiceId} (${res.status}). ${text.slice(0, 200)}`
    );
  }
  const j = (await res.json()) as {
    id?: string;
    status?: string;
    amount?: { value?: string; currency_code?: string };
    detail?: {
      currency_code?: string;
      metadata?: { recipient_view_url?: string };
    };
  };
  return {
    id: j.id || invoiceId,
    status: j.status || "",
    recipientViewUrl: j.detail?.metadata?.recipient_view_url,
    amountValue: j.amount?.value,
    currency: j.amount?.currency_code || j.detail?.currency_code,
  };
}

/* ------------------------------------------------------------------ */
/* Webhook signature verification                                      */
/* ------------------------------------------------------------------ */

/**
 * Verify a webhook delivery against PAYPAL_WEBHOOK_ID. Returns false (never
 * throws to the caller's benefit is handled upstream) when the id is unset or
 * PayPal reports anything other than SUCCESS.
 */
export async function verifyWebhookSignature(
  headers: {
    "paypal-auth-algo": string;
    "paypal-cert-url": string;
    "paypal-transmission-id": string;
    "paypal-transmission-sig": string;
    "paypal-transmission-time": string;
  },
  rawBody: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  const token = await getAccessToken();
  const payload = {
    auth_algo: headers["paypal-auth-algo"],
    cert_url: headers["paypal-cert-url"],
    transmission_id: headers["paypal-transmission-id"],
    transmission_sig: headers["paypal-transmission-sig"],
    transmission_time: headers["paypal-transmission-time"],
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody),
  };
  const res = await fetch(
    `${apiBase()}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  );
  if (!res.ok) return false;
  const j = (await res.json()) as { verification_status?: string };
  return j.verification_status === "SUCCESS";
}
