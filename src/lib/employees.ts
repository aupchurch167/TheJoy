/**
 * The staff roster for internal (employee) feedback. Kept deliberately separate
 * from `leads` (families) so the two audiences never mix in a send.
 *
 * Rows can come in three ways: added by hand, imported from a CSV, or (later)
 * synced from Connecteam / Gusto. `external_source` + `external_id` let a sync
 * reconcile the same person across runs without creating duplicates.
 */

import { query } from "./db";

export type EmployeeSource = "manual" | "csv" | "connecteam" | "gusto";

export type Employee = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  active: boolean;
  sms_consent: boolean;
  external_source: string | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
};

export type EmployeeInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  active?: boolean;
  smsConsent?: boolean;
  source?: EmployeeSource;
  externalId?: string | null;
};

const clean = (s?: string | null): string | null => {
  const t = (s ?? "").trim();
  return t ? t : null;
};

/** All employees, active first, then by name. */
export async function listEmployees(): Promise<Employee[]> {
  return query<Employee>(
    `SELECT * FROM employees ORDER BY active DESC, lower(name) ASC`
  );
}

/** Active employees who can actually be surveyed (have an email or a phone). */
export async function listReachableEmployees(): Promise<Employee[]> {
  return query<Employee>(
    `SELECT * FROM employees
      WHERE active = TRUE
        AND ( (email IS NOT NULL AND email <> '')
              OR (phone IS NOT NULL AND phone <> '') )
      ORDER BY lower(name) ASC`
  );
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const rows = await query<Employee>(`SELECT * FROM employees WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function countEmployees(): Promise<{ total: number; active: number }> {
  const rows = await query<{ total: string; active: string }>(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER (WHERE active) AS active
       FROM employees`
  );
  return {
    total: Number(rows[0]?.total ?? 0),
    active: Number(rows[0]?.active ?? 0),
  };
}

/**
 * Insert an employee. On an email or external-id collision the existing row is
 * updated instead (so re-imports and syncs are idempotent). Returns the row.
 */
export async function upsertEmployee(input: EmployeeInput): Promise<Employee> {
  const email = clean(input.email)?.toLowerCase() ?? null;
  const phone = clean(input.phone);
  const smsConsent = !!input.smsConsent && !!phone;
  const source = input.source ?? "manual";
  const externalId = clean(input.externalId);

  // Reconcile first by external identity (a sync), then by email (a re-add).
  if (externalId) {
    const existing = await query<Employee>(
      `SELECT * FROM employees WHERE external_source = $1 AND external_id = $2`,
      [source, externalId]
    );
    if (existing[0]) return updateEmployee(existing[0].id, input);
  }
  if (email) {
    const existing = await query<Employee>(
      `SELECT * FROM employees WHERE lower(email) = $1`,
      [email]
    );
    if (existing[0]) return updateEmployee(existing[0].id, input);
  }

  const rows = await query<Employee>(
    `INSERT INTO employees
       (name, email, phone, title, active, sms_consent, external_source, external_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.name.trim(),
      email,
      phone,
      clean(input.title),
      input.active ?? true,
      smsConsent,
      source,
      externalId,
    ]
  );
  return rows[0];
}

/** Patch an employee. Only provided fields change. */
export async function updateEmployee(
  id: string,
  input: Partial<EmployeeInput>
): Promise<Employee> {
  const email =
    input.email === undefined ? undefined : clean(input.email)?.toLowerCase() ?? null;
  const phone = input.phone === undefined ? undefined : clean(input.phone);
  const rows = await query<Employee>(
    `UPDATE employees SET
        name        = COALESCE($2, name),
        email       = COALESCE($3, email),
        phone       = COALESCE($4, phone),
        title       = COALESCE($5, title),
        active      = COALESCE($6, active),
        sms_consent = COALESCE($7, sms_consent),
        updated_at  = now()
      WHERE id = $1
      RETURNING *`,
    [
      id,
      input.name?.trim() ?? null,
      email ?? null,
      phone ?? null,
      clean(input.title) ?? null,
      input.active ?? null,
      input.smsConsent ?? null,
    ]
  );
  return rows[0];
}

/* ---------------- Connecteam sync ---------------- */

export type ConnecteamUpsert = {
  externalId: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  active: boolean;
};

/**
 * Reconcile one Connecteam user into the roster. Matches first by external id
 * (a prior sync), then adopts a matching email row (someone added by hand),
 * otherwise inserts. Connecteam is the source of truth, so name/email/phone/
 * title/active are overwritten from it. Returns 'added' or 'updated'.
 */
export async function upsertFromConnecteam(
  u: ConnecteamUpsert
): Promise<"added" | "updated"> {
  const email = clean(u.email)?.toLowerCase() ?? null;
  const phone = clean(u.phone);
  const title = clean(u.title);

  // 1. Already synced: update in place by external identity.
  const byExternal = await query<{ id: string }>(
    `SELECT id FROM employees WHERE external_source = 'connecteam' AND external_id = $1`,
    [u.externalId]
  );
  if (byExternal[0]) {
    await query(
      `UPDATE employees SET
          name = $2, email = $3, phone = $4, title = $5, active = $6,
          updated_at = now()
        WHERE id = $1`,
      [byExternal[0].id, u.name.trim(), email, phone, title, u.active]
    );
    return "updated";
  }

  // 2. Adopt a hand-added row with the same email (claim it for Connecteam).
  if (email) {
    const byEmail = await query<{ id: string }>(
      `SELECT id FROM employees WHERE lower(email) = $1`,
      [email]
    );
    if (byEmail[0]) {
      await query(
        `UPDATE employees SET
            name = $2, email = $3, phone = $4, title = $5, active = $6,
            external_source = 'connecteam', external_id = $7, updated_at = now()
          WHERE id = $1`,
        [byEmail[0].id, u.name.trim(), email, phone, title, u.active, u.externalId]
      );
      return "updated";
    }
  }

  // 3. New person.
  await query(
    `INSERT INTO employees
       (name, email, phone, title, active, external_source, external_id)
     VALUES ($1, $2, $3, $4, $5, 'connecteam', $6)`,
    [u.name.trim(), email, phone, title, u.active, u.externalId]
  );
  return "added";
}

/**
 * Deactivate Connecteam-sourced employees who were NOT in the latest sync (they
 * were deleted in Connecteam). We deactivate rather than delete so their past
 * survey responses are preserved. Hand-added people (no external id) are never
 * touched. Returns how many were deactivated.
 */
export async function deactivateMissingConnecteam(
  seenExternalIds: string[]
): Promise<number> {
  const rows = await query<{ id: string }>(
    `UPDATE employees SET active = FALSE, updated_at = now()
      WHERE external_source = 'connecteam'
        AND active = TRUE
        AND NOT (external_id = ANY($1::text[]))
      RETURNING id`,
    [seenExternalIds.length ? seenExternalIds : [""]]
  );
  return rows.length;
}

export async function setEmployeeActive(id: string, active: boolean): Promise<void> {
  await query(`UPDATE employees SET active = $2, updated_at = now() WHERE id = $1`, [
    id,
    active,
  ]);
}

export async function deleteEmployee(id: string): Promise<void> {
  await query(`DELETE FROM employees WHERE id = $1`, [id]);
}
