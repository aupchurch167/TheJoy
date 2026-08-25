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
  hire_date: string | null;
  birth_date: string | null;
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
  hireDate?: string | null;
  birthDate?: string | null;
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
       (name, email, phone, title, active, sms_consent, external_source, external_id,
        hire_date, birth_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
      clean(input.hireDate),
      clean(input.birthDate),
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
        hire_date   = COALESCE($8, hire_date),
        birth_date  = COALESCE($9, birth_date),
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
      clean(input.hireDate) ?? null,
      clean(input.birthDate) ?? null,
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
  hireDate?: string | null;
  birthDate?: string | null;
};

export type UpsertOutcome = {
  id: string;
  outcome: "added" | "updated";
  /** True when this sync flipped an already-existing active person to inactive. */
  becameInactive: boolean;
};

/**
 * Reconcile one Connecteam user into the roster. Matches first by external id
 * (a prior sync), then adopts a matching email row (someone added by hand),
 * otherwise inserts. Connecteam is the source of truth, so name/email/phone/
 * title/active are overwritten from it (dates only fill blanks, so a manually
 * set date is never wiped by a Connecteam account that lacks the field).
 */
export async function upsertFromConnecteam(
  u: ConnecteamUpsert
): Promise<UpsertOutcome> {
  const email = clean(u.email)?.toLowerCase() ?? null;
  const phone = clean(u.phone);
  const title = clean(u.title);
  const hire = clean(u.hireDate);
  const birth = clean(u.birthDate);

  const updateExisting = async (id: string, wasActive: boolean, adopt: boolean) => {
    await query(
      `UPDATE employees SET
          name = $2, email = $3, phone = $4, title = $5, active = $6,
          hire_date  = COALESCE($7, hire_date),
          birth_date = COALESCE($8, birth_date)${
            adopt ? `, external_source = 'connecteam', external_id = $9` : ""
          },
          updated_at = now()
        WHERE id = $1`,
      adopt
        ? [id, u.name.trim(), email, phone, title, u.active, hire, birth, u.externalId]
        : [id, u.name.trim(), email, phone, title, u.active, hire, birth]
    );
    return {
      id,
      outcome: "updated" as const,
      becameInactive: wasActive && !u.active,
    };
  };

  // 1. Already synced: update in place by external identity.
  const byExternal = await query<{ id: string; active: boolean }>(
    `SELECT id, active FROM employees WHERE external_source = 'connecteam' AND external_id = $1`,
    [u.externalId]
  );
  if (byExternal[0]) {
    return updateExisting(byExternal[0].id, byExternal[0].active, false);
  }

  // 2. Adopt a hand-added row with the same email (claim it for Connecteam).
  if (email) {
    const byEmail = await query<{ id: string; active: boolean }>(
      `SELECT id, active FROM employees WHERE lower(email) = $1`,
      [email]
    );
    if (byEmail[0]) {
      return updateExisting(byEmail[0].id, byEmail[0].active, true);
    }
  }

  // 3. New person.
  const rows = await query<{ id: string }>(
    `INSERT INTO employees
       (name, email, phone, title, active, external_source, external_id,
        hire_date, birth_date)
     VALUES ($1, $2, $3, $4, $5, 'connecteam', $6, $7, $8)
     RETURNING id`,
    [u.name.trim(), email, phone, title, u.active, u.externalId, hire, birth]
  );
  return { id: rows[0].id, outcome: "added", becameInactive: false };
}

/**
 * Deactivate Connecteam-sourced employees who were NOT in the latest sync (they
 * were deleted in Connecteam). We deactivate rather than delete so their past
 * survey responses are preserved. Hand-added people (no external id) are never
 * touched. Returns the ids that were deactivated.
 */
export async function deactivateMissingConnecteam(
  seenExternalIds: string[]
): Promise<string[]> {
  const rows = await query<{ id: string }>(
    `UPDATE employees SET active = FALSE, updated_at = now()
      WHERE external_source = 'connecteam'
        AND active = TRUE
        AND NOT (external_id = ANY($1::text[]))
      RETURNING id`,
    [seenExternalIds.length ? seenExternalIds : [""]]
  );
  return rows.map((r) => r.id);
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
