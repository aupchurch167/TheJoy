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
  mapPaypalStatus,
} from "@/lib/deposits";
import { getSettings } from "@/lib/settings";

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
    await insertDepositRequest({
      leadId: input.leadId || null,
      recipientName: name,
      recipientEmail: email,
      amountCents: cents,
      currency: "USD",
      note: note ?? null,
      providerInvoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber ?? null,
      invoiceUrl: invoice.recipientViewUrl ?? null,
      status: mapPaypalStatus(invoice.status),
      createdBy: adminEmail,
    });
    revalidatePath("/admin/deposits");
    return {
      ok: true,
      message: `Deposit request sent to ${email}. PayPal will email the invoice and track payment.`,
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
