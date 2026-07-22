/**
 * Next.js instrumentation hook: runs once when the server starts.
 *
 * We use it to auto-apply the database schema on boot, so deploying is simply
 * "set DATABASE_URL and redeploy" (no separate migrate step for a non-developer
 * operator). The schema is idempotent (CREATE ... IF NOT EXISTS, ADD COLUMN IF
 * NOT EXISTS, seed with ON CONFLICT DO NOTHING), so applying it every boot is
 * safe. It is best-effort: failures are logged, never fatal, so the site still
 * starts and shows its graceful "database not connected" states.
 */
export async function register() {
  // Only the Node.js server runtime (not Edge) can talk to Postgres.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.info("[migrate] DATABASE_URL not set; skipping schema apply.");
    return;
  }
  // Opt out with AUTO_MIGRATE=false if you'd rather run migrations by hand.
  if (process.env.AUTO_MIGRATE === "false") {
    console.info("[migrate] AUTO_MIGRATE=false; skipping schema apply.");
    return;
  }

  try {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const pg = (await import("pg")).default;

    const sql = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");

    const sslDisabled =
      process.env.PGSSL === "false" || /\bsslmode=disable\b/.test(url);
    const needsSsl =
      !sslDisabled &&
      (process.env.PGSSL === "true" ||
        /\bsslmode=require\b/.test(url) ||
        process.env.NODE_ENV === "production");

    const client = new pg.Client({
      connectionString: url,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    });
    await client.connect();
    try {
      await client.query(sql);
      console.info("[migrate] Schema applied (tables ready).");
    } finally {
      await client.end();
    }
  } catch (err) {
    console.error(
      "[migrate] Could not apply schema on boot (the site will still start):",
      err instanceof Error ? err.message : err
    );
  }
}
