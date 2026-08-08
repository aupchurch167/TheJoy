"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import {
  paypalEnabled,
  createAndSendDepositInvoice,
  getInvoice,
  cancelInvoice,
} from "@/lib/paypal";
import {
  insertDepositRequest,
  getDepositById,
  updateDepositStatus,
  setDepositArchived,
  deleteDepositRow,
  isCancelable,
  dollarsToCents,
  centsToValue,
  formatMoney,
  mapPaypalStatus,
} from "@/lib/deposits";
import { getSettings } from "@/lib/settings";
import { emailEnabled, sendDepositEmail } from "@/lib/email";
import { smsEnabled, sendSms, toE164 } from "@/lib/sms";
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
  phone?: string;
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
  // Phone is optional (only used for text reminders); store E.164 if valid.
  const phoneInput = (input.phone ?? "").trim();
  const phone = phoneInput ? toE164(phoneInput) : null;
  if (phoneInput && !phone) {
    return { ok: false, error: "That phone number does not look valid (use a US number)." };
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
      recipientPhone: phone,
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

/** Email the family the payment link again (a friendly reminder). */
export async function sendDepositReminderEmail(
  id: string
): Promise<DepositResult> {
  await requireAdmin();
  if (!hasDatabase()) return { ok: false, error: "Database not connected." };

  const dep = await getDepositById(id);
  if (!dep) return { ok: false, error: "Deposit request not found." };
  if (dep.status === "paid") {
    return { ok: false, error: "This deposit is already paid." };
  }
  if (!dep.invoice_url) {
    return {
      ok: false,
      error: "No payment link on this request. Click Refresh first.",
    };
  }
  if (!emailEnabled()) {
    return { ok: false, error: "Email is not turned on (set RESEND_API_KEY)." };
  }

  try {
    await sendDepositEmail({
      to: dep.recipient_email,
      name: dep.recipient_name,
      amountFormatted: formatMoney(dep.amount_cents, dep.currency),
      payUrl: dep.invoice_url,
      note: dep.note,
      reminder: true,
    });
    return { ok: true, message: `Reminder emailed to ${dep.recipient_email}.` };
  } catch (err) {
    console.error("[sendDepositReminderEmail]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not send the reminder.",
    };
  }
}

/** Text the family the payment link (needs a phone on the request + SMS set up). */
export async function sendDepositReminderText(
  id: string
): Promise<DepositResult> {
  await requireAdmin();
  if (!hasDatabase()) return { ok: false, error: "Database not connected." };

  const dep = await getDepositById(id);
  if (!dep) return { ok: false, error: "Deposit request not found." };
  if (dep.status === "paid") {
    return { ok: false, error: "This deposit is already paid." };
  }
  const to = toE164(dep.recipient_phone);
  if (!to) {
    return {
      ok: false,
      error: "No valid phone number on this request. Add one to text a reminder.",
    };
  }
  if (!dep.invoice_url) {
    return {
      ok: false,
      error: "No payment link on this request. Click Refresh first.",
    };
  }
  if (!smsEnabled()) {
    return { ok: false, error: "Texting is not set up (see OPERATIONS.md)." };
  }

  const amount = formatMoney(dep.amount_cents, dep.currency);
  const content = `${BUSINESS.name}: your move-in deposit of ${amount}. Pay securely here: ${dep.invoice_url} (questions? call ${BUSINESS.phone})`;

  const res = await sendSms(to, content);
  if (!res.ok) {
    return { ok: false, error: res.error || "Could not send the text." };
  }
  return { ok: true, message: `Reminder texted to ${dep.recipient_phone}.` };
}

/** Cancel an open, unpaid invoice on PayPal (voids the payment request). */
export async function cancelDepositRequest(id: string): Promise<DepositResult> {
  await requireAdmin();
  if (!hasDatabase()) return { ok: false, error: "Database not connected." };
  if (!paypalEnabled()) return { ok: false, error: "PayPal is not configured." };

  const dep = await getDepositById(id);
  if (!dep) return { ok: false, error: "Deposit request not found." };
  if (!dep.provider_invoice_id) {
    return { ok: false, error: "No PayPal invoice is attached to this request." };
  }
  if (!isCancelable(dep.status)) {
    return {
      ok: false,
      error: `This request cannot be cancelled (it is ${dep.status.replace(/_/g, " ")}).`,
    };
  }

  try {
    await cancelInvoice(dep.provider_invoice_id);
    await updateDepositStatus(id, "cancelled", false);
    revalidatePath("/admin/deposits");
    return { ok: true, message: "Deposit request cancelled on PayPal." };
  } catch (err) {
    console.error("[cancelDepositRequest]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not cancel the request.",
    };
  }
}

/** Archive (hide from the list) or restore a deposit row. Local only. */
export async function setDepositArchivedState(
  id: string,
  archived: boolean
): Promise<DepositResult> {
  await requireAdmin();
  if (!hasDatabase()) return { ok: false, error: "Database not connected." };
  try {
    await setDepositArchived(id, archived);
    revalidatePath("/admin/deposits");
    return {
      ok: true,
      message: archived ? "Moved to archive." : "Restored from archive.",
    };
  } catch (err) {
    console.error("[setDepositArchivedState]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not update the request.",
    };
  }
}

/** Permanently remove the local record (PayPal keeps its own copy). */
export async function deleteDepositRequest(id: string): Promise<DepositResult> {
  await requireAdmin();
  if (!hasDatabase()) return { ok: false, error: "Database not connected." };
  try {
    await deleteDepositRow(id);
    revalidatePath("/admin/deposits");
    return { ok: true, message: "Deleted from your history." };
  } catch (err) {
    console.error("[deleteDepositRequest]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not delete the request.",
    };
  }
}
