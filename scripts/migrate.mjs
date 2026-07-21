// Applies db/schema.sql to the database in DATABASE_URL.
// Usage: npm run migrate
// Safe to run repeatedly (schema uses IF NOT EXISTS).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Set it and try again.");
  process.exit(1);
}

const sql = readFileSync(join(__dirname, "..", "db", "schema.sql"), "utf8");

const needsSsl =
  process.env.PGSSL === "true" ||
  /\bsslmode=require\b/.test(url) ||
  process.env.NODE_ENV === "production";

const client = new pg.Client({
  connectionString: url,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Migration complete. Tables are ready.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
