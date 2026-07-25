// Import the family-contacts directory into the `families` audience.
//
// Usage:
//   node scripts/import-family-contacts.mjs [data/family-contacts.csv] [--dry]
//
// Reads a CSV with columns: resident_name, relation, contact_name, phone,
// email, preference. Each row becomes a family contact (audience='families')
// linked to its resident, marked active. Contacts with a "Do Not Contact"
// preference are stored but flagged unsubscribed, so community emails skip them.
// Idempotent: a contact already present (by email, or by resident + name) is
// skipped, so re-running is safe.
//
// Env:
//   DATABASE_URL   required (unless --dry)
//   PGSSL          "false" to disable TLS (local Postgres)

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const file = process.argv[2] && !process.argv[2].startsWith("--")
  ? process.argv[2]
  : join(ROOT, "data", "family-contacts.csv");
const dry = process.argv.includes("--dry");

/* ---------------- CSV parsing ---------------- */

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function toRecords(text) {
  const rows = parseCSV(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => {
    const o = {};
    header.forEach((h, i) => (o[h] = (r[i] ?? "").trim()));
    return o;
  });
}

/* ---------------- run ---------------- */

const records = toRecords(readFileSync(file, "utf8"));
console.log(`Parsed ${records.length} family contacts from ${file}`);

const clean = records
  .map((r) => ({
    residentName: r.resident_name || "",
    relation: r.relation || "",
    name: r.contact_name || "",
    phone: r.phone || "",
    email: (r.email || "").toLowerCase(),
    doNotContact: /do not contact/i.test(r.preference || ""),
  }))
  .filter((r) => r.name);

if (dry) {
  console.log(`[dry] Would import ${clean.length} contacts. Sample:`);
  clean.slice(0, 5).forEach((r) => console.log("  ", r));
  process.exit(0);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required (or pass --dry).");
  process.exit(1);
}
const sslDisabled =
  process.env.PGSSL === "false" || /\bsslmode=disable\b/.test(url);
const needsSsl =
  !sslDisabled &&
  (process.env.PGSSL === "true" ||
    /\bsslmode=require\b/.test(url) ||
    process.env.NODE_ENV === "production");
const pool = new pg.Pool({
  connectionString: url,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

let added = 0;
let skipped = 0;
try {
  for (const r of clean) {
    // Dedupe: by email if present, else by resident + contact name.
    const dupe = await pool.query(
      `SELECT id FROM leads
        WHERE audience = 'families'
          AND (
            ($1 <> '' AND lower(email) = lower($1))
            OR ($1 = '' AND lower(coalesce(resident_name,'')) = lower($2)
                        AND lower(name) = lower($3))
          )
        LIMIT 1`,
      [r.email, r.residentName, r.name]
    );
    if (dupe.rows.length) { skipped++; continue; }

    await pool.query(
      `INSERT INTO leads
         (name, email, phone, source, audience, consent, drip_status,
          resident_name, relation, active, unsubscribed_at)
       VALUES ($1, $2, $3, 'family_import', 'families', TRUE, 'completed',
               $4, $5, TRUE, $6)`,
      [
        r.name,
        r.email || null,
        r.phone || null,
        r.residentName || null,
        r.relation || null,
        r.doNotContact ? new Date().toISOString() : null,
      ]
    );
    added++;
  }
  console.log(`Done. Added ${added}, skipped ${skipped} (already present).`);
} catch (err) {
  console.error("Import failed:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
