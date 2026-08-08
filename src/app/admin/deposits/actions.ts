"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import {
  paypalEnabled,
  createAndSendDepositInvoice,
  getInvoice,
} from "@/lib/paypal";
import {
  insertDepositRequest,
  getDepositById,
  updateDepositStatus,
  dollarsToCents,
  centsToValue,
  formatMoney,
  mapPaypalStatus,
} from "@/lib/deposits";
import { getSettings } from "@/lib/settings";
import { emailEnabled, sendDepositEmail } from "@/lib/email";
import { BUSINESS } from "@/lib/site";

export type DepositResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Create and send a PayPal deposit invoice, then record it locally. PayPal
 * emails the family a hosted invoice and tracks payment; we store the row so
 * the Deposits screen shows history + status.
 */
export async function sendDepositRequest(input: {
  name: string;
  email: string;
  amount: string;
  note?: string;
  leadId?: string | null;
}): Promise<DepositResult> {
  const { email: adminEmail } = await requireAdmin();

  if (!hasDatabase()) {
    return { ok: false, error: "Database not connected." };
  }
  if (!paypalEnabled()) {
    return {
      ok: false,
      error:
        "PayPal is not configured yet. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in Railway (see OPERATIONS.md).",
    };
  }

  const name = (input.name || "").trim();
  const email = (input.email || "").trim().toLowerCase();
  if (!name) return { ok: false, error: "Enter the family member's name." };
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const cents = dollarsToCents(input.amount || "");
  if (cents == null) {
    return { ok: false, error: "Enter a deposit amount greater than zero." };
  }

  // Fall back to the saved default note when the form left it blank.
  const settings = await getSettings();
  const note = (input.note ?? "").trim() || settings.deposit_note.trim() || undefined;

  try {
    const invoice = await createAndSendDepositInvoice({
      name,
      email,
      amountValue: centsToValue(cents),
      note,
    });
    const payUrl = invoice.recipientViewUrl;

    // Email the payment link ourselves from hello@joyseniorcare.com (PayPal's
    // own email is suppressed). Non-fatal: if it fails, the invoice still
    // exists and the office can copy the link from the row's "View".
    let emailed = false;
    let emailError: string | null = null;
    if (payUrl && emailEnabled()) {
      try {
        emailed = await sendDepositEmail({
          to: email,
          name,
          amountFormatted: formatMoney(cents, "USD"),
          payUrl,
          note: note ?? null,
        });
      } catch (e) {
        console.error("[sendDepositRequest] email send failed", e);
        emailError = e instanceof Error ? e.message : "email failed";
      }
    }

    await insertDepositRequest({
      leadId: input.leadId || null,
      recipientName: name,
      recipientEmail: email,
      amountCents: cents,
      currency: "USD",
      note: note ?? null,
      providerInvoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber ?? null,
      invoiceUrl: payUrl ?? null,
      status: mapPaypalStatus(invoice.status),
      createdBy: adminEmail,
    });
    revalidatePath("/admin/deposits");

    if (emailed) {
      return {
        ok: true,
        message: `Deposit request emailed to ${email} from ${BUSINESS.email}. It will show as paid here once they pay.`,
      };
    }
    if (!emailEnabled()) {
      return {
        ok: true,
        message: `Invoice created, but email is not turned on (set RESEND_API_KEY). Use "View" on the row to copy the payment link and send it yourself.`,
      };
    }
    if (!payUrl) {
      return {
        ok: true,
        message: `Invoice created, but PayPal has not returned a payment link yet. Click "Refresh" on the row, then use "View" to copy it.`,
      };
    }
    return {
      ok: true,
      message: `Invoice created, but the email could not be sent${
        emailError ? ` (${emailError})` : ""
      }. Use "View" on the row to copy the payment link and send it yourself.`,
    };
  } catch (err) {
    console.error("[sendDepositRequest]", err);
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Could not send the deposit request.",
    };
  }
}

/** Re-read one invoice's status from PayPal (manual reconciliation). */
export async function refreshDepositStatus(id: string): Promise<DepositResult> {
  await requireAdmin();

  if (!hasDatabase()) return { ok: false, error: "Database not connected." };
  if (!paypalEnabled()) return { ok: false, error: "PayPal is not configured." };

  const dep = await getDepositById(id);
  if (!dep || !dep.provider_invoice_id) {
    return { ok: false, error: "No PayPal invoice is attached to this request." };
  }

  try {
    const invoice = await getInvoice(dep.provider_invoice_id);
    const status = mapPaypalStatus(invoice.status);
    await updateDepositStatus(id, status, status === "paid");
    revalidatePath("/admin/deposits");
    return { ok: true, message: `Status updated: ${status.replace(/_/g, " ")}.` };
  } catch (err) {
    console.error("[refreshDepositStatus]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not refresh status.",
    };
  }
}
