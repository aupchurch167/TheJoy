import { query } from "./db";

export type LeadInput = {
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  source?: string;
  consent?: boolean;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source: string;
  consent: boolean;
  unsubscribe_token: string;
  unsubscribed_at: string | null;
  created_at: string;
};

/** Insert a lead and return the stored row (including its unsubscribe token). */
export async function insertLead(input: LeadInput): Promise<Lead> {
  const rows = await query<Lead>(
    `INSERT INTO leads (name, email, phone, message, source, consent)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.name,
      input.email.toLowerCase(),
      input.phone ?? null,
      input.message ?? null,
      input.source ?? "homepage_form",
      input.consent ?? true,
    ]
  );
  return rows[0];
}

/** Mark a lead unsubscribed by its token. Returns true if a row was updated. */
export async function unsubscribeByToken(token: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `UPDATE leads
       SET unsubscribed_at = now()
     WHERE unsubscribe_token = $1
       AND unsubscribed_at IS NULL
     RETURNING id`,
    [token]
  );
  return rows.length > 0;
}
