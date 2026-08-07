import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/paypal";
import {
  getDepositByInvoiceId,
  updateDepositStatus,
  mapPaypalStatus,
} from "@/lib/deposits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PayPal webhook: keeps deposit_requests.status in sync when a family pays,
 * cancels, or a refund is issued, without anyone clicking "Refresh".
 *
 * SECURITY: every delivery is verified against PAYPAL_WEBHOOK_ID via PayPal's
 * verify-webhook-signature API. Without that env var the endpoint refuses to
 * run (503), so it can never be spoofed. The manual "Refresh" button on the
 * Deposits screen covers reconciliation until the webhook is configured.
 *
 * Subscribe this URL (https://www.joyseniorcare.com/api/webhooks/paypal) to the
 * INVOICING.INVOICE.* events in the PayPal app's webhooks settings, then paste
 * the generated Webhook ID into PAYPAL_WEBHOOK_ID.
 */

/** Fallback status when the event omits the invoice's own status field. */
function statusFromEventType(type: string): string {
  if (type.endsWith("PAID")) return "paid";
  if (type.endsWith("CANCELLED")) return "cancelled";
  if (type.endsWith("REFUNDED")) return "refunded";
  return "sent";
}

export async function POST(request: Request) {
  if (!process.env.PAYPAL_WEBHOOK_ID) {
    return NextResponse.json(
      { ok: false, error: "Webhook not configured." },
      { status: 503 }
    );
  }

  // Read the raw body once: signature verification needs the exact bytes.
  const raw = await request.text();

  const headers = {
    "paypal-auth-algo": request.headers.get("paypal-auth-algo") || "",
    "paypal-cert-url": request.headers.get("paypal-cert-url") || "",
    "paypal-transmission-id": request.headers.get("paypal-transmission-id") || "",
    "paypal-transmission-sig":
      request.headers.get("paypal-transmission-sig") || "",
    "paypal-transmission-time":
      request.headers.get("paypal-transmission-time") || "",
  };

  let verified = false;
  try {
    verified = await verifyWebhookSignature(headers, raw);
  } catch (err) {
    console.error("[paypal webhook] verification error:", err);
  }
  if (!verified) {
    return NextResponse.json(
      { ok: false, error: "Signature verification failed." },
      { status: 401 }
    );
  }

  if (!hasDatabase()) {
    return NextResponse.json({ ok: true, note: "No database configured." });
  }

  let event: {
    event_type?: string;
    resource?: {
      id?: string;
      status?: string;
      invoice?: { id?: string; status?: string };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const type = event.event_type || "";
  const resource = event.resource ?? {};
  // Invoicing events carry the invoice either as the resource itself or nested.
  const invoiceId = resource.invoice?.id || resource.id;
  const paypalStatus = resource.invoice?.status || resource.status;

  if (!type.startsWith("INVOICING.") || !invoiceId) {
    // Not an invoicing event we track (still ack so PayPal stops retrying).
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const dep = await getDepositByInvoiceId(invoiceId);
    if (!dep) {
      // An invoice we did not send (or was deleted): ack without changes.
      return NextResponse.json({ ok: true, unmatched: true });
    }
    const status = paypalStatus
      ? mapPaypalStatus(paypalStatus)
      : statusFromEventType(type);
    await updateDepositStatus(dep.id, status, status === "paid");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[paypal webhook] update failed:", err);
    return NextResponse.json(
      { ok: false, error: "Could not update deposit." },
      { status: 500 }
    );
  }
}
