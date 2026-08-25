/**
 * Tiny JSON key/value store for integration bookkeeping (last Connecteam sync,
 * last recognition digest, etc.). Backed by the `integration_state` table.
 */

import { query } from "./db";

export async function getIntegrationState<T = unknown>(
  key: string
): Promise<T | null> {
  const rows = await query<{ value: T }>(
    `SELECT value FROM integration_state WHERE key = $1`,
    [key]
  );
  return rows[0]?.value ?? null;
}

export async function setIntegrationState(
  key: string,
  value: unknown
): Promise<void> {
  await query(
    `INSERT INTO integration_state (key, value, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)]
  );
}
