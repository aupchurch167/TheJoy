import { query } from "./db";

/**
 * The suppression list. An address on it is never emailed, no override (spec
 * §1, §4). It is the union of unsubscribes, hard bounces, spam complaints, the
 * deceased list, and manual admin adds. The recipient resolver and the CSV
 * import both consult it, and the Resend webhook + unsubscribe flow write to it.
 */

export type SuppressionReason =
  | "unsubscribe"
  | "bounce"
  | "complaint"
  | "deceased"
  | "manual";

export type Suppression = {
  email: string;
  reason: SuppressionReason;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

function norm(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Add an address to the suppression list. First reason wins (a later event does
 * not overwrite why it was suppressed). Returns true if it was newly added.
 */
export async function suppressEmail(
  email: string,
  reason: SuppressionReason,
  opts?: { note?: string | null; createdBy?: string | null }
): Promise<boolean> {
  const e = norm(email);
  if (!e) return false;
  const rows = await query<{ email: string }>(
    `INSERT INTO suppressions (email, reason, note, created_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING
     RETURNING email`,
    [e, reason, opts?.note ?? null, opts?.createdBy ?? null]
  );
  return rows.length > 0;
}

/** Is this address suppressed? */
export async function isSuppressed(email: string): Promise<boolean> {
  const e = norm(email);
  if (!e) return false;
  const rows = await query<{ email: string }>(
    `SELECT email FROM suppressions WHERE email = $1 LIMIT 1`,
    [e]
  );
  return rows.length > 0;
}

/** All suppressed addresses as a set (for bulk import / recipient math). */
export async function getSuppressedEmails(): Promise<Set<string>> {
  const rows = await query<{ email: string }>(`SELECT email FROM suppressions`);
  return new Set(rows.map((r) => r.email));
}

/** Which of these addresses are suppressed (lowercased set), for the panel. */
export async function suppressedAmong(emails: string[]): Promise<Set<string>> {
  const list = emails.map(norm).filter(Boolean);
  if (list.length === 0) return new Set();
  const rows = await query<{ email: string }>(
    `SELECT email FROM suppressions WHERE email = ANY($1::text[])`,
    [list]
  );
  return new Set(rows.map((r) => r.email));
}

export async function listSuppressions(): Promise<Suppression[]> {
  return query<Suppression>(
    `SELECT * FROM suppressions ORDER BY created_at DESC`
  );
}

export async function countSuppressions(): Promise<number> {
  const rows = await query<{ n: string }>(`SELECT COUNT(*) AS n FROM suppressions`);
  return Number(rows[0]?.n ?? 0);
}

/** Remove an address from the list (Adam admin only). */
export async function removeSuppression(email: string): Promise<void> {
  await query(`DELETE FROM suppressions WHERE email = $1`, [norm(email)]);
}
