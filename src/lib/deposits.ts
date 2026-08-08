import { query } from "./db";

/**
 * Deposit requests: the local record of deposits the office asked families to
 * pay via PayPal invoices. PayPal owns the payment page and the money; this
 * table powers the admin Deposits screen (history + paid/unpaid status).
 *
 * The webhook (/api/webhooks/paypal) and the manual "Refresh" action both call
 * updateDepositStatus to keep `status` in sync with PayPal.
 */

export type DepositRequest = {
  id: string;
  lead_id: string | null;
  recipient_name: string;
  recipient_email: string;
  recipient_phone: string | null;
  amount_cents: number;
  currency: string;
  note: string | null;
  provider: string;
  provider_invoice_id: string | null;
  invoice_number: string | null;
  invoice_url: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  paid_at: string | null;
  updated_at: string;
  archived_at: string | null;
};

/** Statuses that are "open" on PayPal and can still be cancelled. */
export function isCancelable(status: string): boolean {
  return status === "sent" || status === "partially_paid";
}

export type NewDepositRequest = {
  leadId?: string | null;
  recipientName: string;
  recipientEmail: string;
  recipientPhone?: string | null;
  amountCents: number;
  currency?: string;
  note?: string | null;
  providerInvoiceId?: string | null;
  invoiceNumber?: string | null;
  invoiceUrl?: string | null;
  status?: string;
  createdBy?: string | null;
};

/* ------------------------------------------------------------------ */
/* Money helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * Parse an admin-entered dollar amount ("500", "$500", "1,250.50") to whole
 * cents. Returns null for anything that is not a positive money value, so the
 * caller can reject it with a friendly message.
 */
export function dollarsToCents(input: string): number | null {
  const cleaned = (input || "").replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const cents = Math.round(parseFloat(cleaned) * 100);
  if (!Number.isFinite(cents) || cents <= 0) return null;
  return cents;
}

/** Cents to a bare "500.00" string for the PayPal `value` field. */
export function centsToValue(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Cents to a localized currency string for display, e.g. "$500.00". */
export function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/**
 * Collapse a PayPal invoice status into the small set we store/display.
 * PayPal statuses: DRAFT, SENT, SCHEDULED, PAYMENT_PENDING, PARTIALLY_PAID,
 * PAID, MARKED_AS_PAID, CANCELLED, REFUNDED, PARTIALLY_REFUNDED,
 * MARKED_AS_REFUNDED, UNPAID.
 */
export function mapPaypalStatus(status: string): string {
  switch ((status || "").toUpperCase()) {
    case "PAID":
    case "MARKED_AS_PAID":
      return "paid";
    case "PARTIALLY_PAID":
      return "partially_paid";
    case "CANCELLED":
      return "cancelled";
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
    case "MARKED_AS_REFUNDED":
      return "refunded";
    case "DRAFT":
      return "draft";
    case "":
      return "sent";
    default:
      // SENT, SCHEDULED, PAYMENT_PENDING, UNPAID all read as "awaiting payment".
      return "sent";
  }
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

export async function insertDepositRequest(
  input: NewDepositRequest
): Promise<DepositRequest> {
  const status = input.status ?? "sent";
  const rows = await query<DepositRequest>(
    `INSERT INTO deposit_requests
       (lead_id, recipient_name, recipient_email, recipient_phone, amount_cents,
        currency, note, provider, provider_invoice_id, invoice_number,
        invoice_url, status, created_by, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'paypal', $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      input.leadId ?? null,
      input.recipientName,
      input.recipientEmail.toLowerCase(),
      input.recipientPhone ?? null,
      input.amountCents,
      input.currency ?? "USD",
      input.note ?? null,
      input.providerInvoiceId ?? null,
      input.invoiceNumber ?? null,
      input.invoiceUrl ?? null,
      status,
      input.createdBy ?? null,
      status === "paid" ? new Date().toISOString() : null,
    ]
  );
  return rows[0];
}

export async function listDepositRequests(
  opts: { archived?: boolean; limit?: number } = {}
): Promise<DepositRequest[]> {
  const { archived = false, limit = 200 } = opts;
  return query<DepositRequest>(
    `SELECT * FROM deposit_requests
      WHERE archived_at IS ${archived ? "NOT NULL" : "NULL"}
      ORDER BY created_at DESC
      LIMIT $1`,
    [limit]
  );
}

/** How many deposits are archived (for the list's toggle label). */
export async function countArchivedDeposits(): Promise<number> {
  const rows = await query<{ n: string }>(
    `SELECT COUNT(*)::int AS n FROM deposit_requests WHERE archived_at IS NOT NULL`
  );
  return Number(rows[0]?.n ?? 0);
}

/** Archive (hide from the default list) or restore a deposit row. */
export async function setDepositArchived(
  id: string,
  archived: boolean
): Promise<void> {
  await query(
    `UPDATE deposit_requests
       SET archived_at = ${archived ? "now()" : "NULL"}, updated_at = now()
     WHERE id = $1`,
    [id]
  );
}

/** Permanently remove the local record (PayPal keeps its own copy). */
export async function deleteDepositRow(id: string): Promise<void> {
  await query(`DELETE FROM deposit_requests WHERE id = $1`, [id]);
}

export async function getDepositById(
  id: string
): Promise<DepositRequest | null> {
  const rows = await query<DepositRequest>(
    `SELECT * FROM deposit_requests WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getDepositByInvoiceId(
  invoiceId: string
): Promise<DepositRequest | null> {
  const rows = await query<DepositRequest>(
    `SELECT * FROM deposit_requests WHERE provider_invoice_id = $1 LIMIT 1`,
    [invoiceId]
  );
  return rows[0] ?? null;
}

/** Update the stored status; stamps paid_at the first time it turns paid. */
export async function updateDepositStatus(
  id: string,
  status: string,
  paid: boolean
): Promise<void> {
  await query(
    `UPDATE deposit_requests
       SET status = $2,
           paid_at = CASE WHEN $3 AND paid_at IS NULL THEN now() ELSE paid_at END,
           updated_at = now()
     WHERE id = $1`,
    [id, status, paid]
  );
}
