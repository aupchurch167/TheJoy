import { Pool } from "pg";

/**
 * One shared Postgres connection pool for the whole app. Reads DATABASE_URL
 * (Railway sets this automatically for its Postgres plugin).
 *
 * If DATABASE_URL is not set, `pool` is null and callers fall back gracefully
 * (the lead form still validates and reports a friendly message rather than
 * crashing the site). This keeps the homepage working before the database is
 * wired up.
 */

const globalForPg = globalThis as unknown as { joyPgPool?: Pool | null };

function createPool(): Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  // Railway/most managed Postgres need SSL; local dev usually does not.
  const needsSsl =
    process.env.PGSSL === "true" ||
    /\bsslmode=require\b/.test(url) ||
    process.env.NODE_ENV === "production";

  return new Pool({
    connectionString: url,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 5,
  });
}

export const pool: Pool | null =
  globalForPg.joyPgPool ?? (globalForPg.joyPgPool = createPool());

export function hasDatabase(): boolean {
  return pool !== null;
}

/** Small typed query helper. Throws if no database is configured. */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  if (!pool) {
    throw new Error("DATABASE_URL is not set; no database configured.");
  }
  const res = await pool.query(text, params);
  return res.rows as T[];
}
