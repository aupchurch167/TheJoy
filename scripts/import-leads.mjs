// Import a list of OLD leads (that did not come from the website) into the
// `leads` table so the email marketing tool can reach them, WITHOUT muddying
// the fresh data the website is gathering.
//
// How they stay separated:
//   - source     = "import" (or "import:<channel>" when the row names a channel)
//                  The leads list + attribution report exclude "import*" by
//                  default, so website metrics stay clean.
//   - drip_status= "completed"  -> the new-lead welcome drip never emails them.
//   - audience   = "leads"      -> broadcasts to the leads audience DO reach
//                  them (the whole point), and every email carries unsubscribe.
//   - consent    = TRUE by default (prior inquiries). Pass --hold to import
//                  them held out of broadcasts (consent=FALSE) for a
//                  re-permission email first.
//   - sms_consent stays FALSE (no texting without explicit opt-in).
//
// Usage:
//   node scripts/import-leads.mjs [data/leads.csv] [flags]
//   (DRY RUN by default; nothing is written until you pass --commit)
//
// Flags:
//   --commit          actually write to the database (default: dry run)
//   --source=import   base source tag (default: "import")
//   --hold            import held out of broadcasts (consent=FALSE)
//
// CSV: a header row is required. Recognized columns (case-insensitive, common
// aliases accepted): name (or first/last, "full name"), email (REQUIRED),
// phone, source/channel (optional), date/created (optional original date),
// message/notes (optional).
//
// Env:
//   DATABASE_URL   required for --commit
//   PGSSL          "false" to disable TLS (local Postgres)

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--")) || join(ROOT, "data", "leads.csv");
const commit = args.includes("--commit");
const hold = args.includes("--hold");
const baseSource =
  (args.find((a) => a.startsWith("--source=")) || "--source=import").split("=")[1] ||
  "import";

/* ---------------- CSV parsing (shared style with import-family-contacts) --- */

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

/** First non-empty value among a set of possible column names. */
function pick(rec, names) {
  for (const n of names) {
    if (rec[n] !== undefined && rec[n] !== "") return rec[n];
  }
  return "";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Tidy a per-row channel into a short source suffix (e.g. "Facebook Ad" -> "facebook_ad"). */
function slugChannel(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
}

/** Parse a loose date string to an ISO timestamp, or "" if unusable. */
function toIso(s) {
  if (!s) return "";
  const t = Date.parse(s);
  return Number.isNaN(t) ? "" : new Date(t).toISOString();
}

/* ---------------- build the clean import rows ---------------- */

const records = toRecords(readFileSync(file, "utf8"));
console.log(`Parsed ${records.length} row(s) from ${file}`);

const seen = new Set();
const clean = [];
let noEmail = 0;
let badEmail = 0;
let dupeInFile = 0;

for (const r of records) {
  const first = pick(r, ["first", "first name", "firstname"]);
  const last = pick(r, ["last", "last name", "lastname"]);
  const name =
    pick(r, ["name", "full name", "fullname", "contact", "contact name"]) ||
    [first, last].filter(Boolean).join(" ").trim();
  const email = pick(r, ["email", "email address", "e-mail"]).toLowerCase();
  const phone = pick(r, ["phone", "phone number", "mobile", "cell", "number"]);
  const channel = pick(r, ["source", "channel", "origin", "lead source"]);
  const dateRaw = pick(r, ["date", "created", "created_at", "created at", "added", "signup date"]);
  const message = pick(r, ["message", "notes", "note", "comment", "comments"]);

  if (!email) { noEmail++; continue; }
  if (!EMAIL_RE.test(email)) { badEmail++; continue; }
  if (seen.has(email)) { dupeInFile++; continue; }
  seen.add(email);

  const source = channel ? `${baseSource}:${slugChannel(channel)}` : baseSource;

  clean.push({
    name: name || null,
    email,
    phone: phone || null,
    message: message || null,
    source,
    createdAt: toIso(dateRaw), // "" -> DB default now()
  });
}

console.log(
  `Usable: ${clean.length}  |  skipped: ${noEmail} no-email, ${badEmail} invalid-email, ${dupeInFile} duplicate-in-file`
);
console.log(
  `Each row will be: audience=leads, drip_status=completed, consent=${hold ? "FALSE (held for re-permission)" : "TRUE"}, sms_consent=FALSE`
);

if (clean.length) {
  console.log("Sample (first 3):");
  clean.slice(0, 3).forEach((r) =>
    console.log(`   ${r.email}  ${r.name ?? "(no name)"}  source=${r.source}  date=${r.createdAt || "now"}`)
  );
}

if (!commit) {
  console.log("\n[dry run] Nothing written. Re-run with --commit to import.");
  process.exit(0);
}

/* ---------------- write to the database ---------------- */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required for --commit.");
  process.exit(1);
}
const sslDisabled = process.env.PGSSL === "false" || /\bsslmode=disable\b/.test(url);
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
let skippedExisting = 0;
try {
  for (const r of clean) {
    // Dedupe against any existing leads-audience contact with this email
    // (a website lead or a prior import), so re-running is safe.
    const dupe = await pool.query(
      `SELECT id FROM leads WHERE audience = 'leads' AND lower(email) = lower($1) LIMIT 1`,
      [r.email]
    );
    if (dupe.rows.length) { skippedExisting++; continue; }

    await pool.query(
      `INSERT INTO leads
         (name, email, phone, message, source, audience, consent, drip_status,
          created_at)
       VALUES ($1, $2, $3, $4, $5, 'leads', $6, 'completed',
               COALESCE($7::timestamptz, now()))`,
      [
        r.name,
        r.email,
        r.phone,
        r.message,
        r.source,
        !hold, // consent
        r.createdAt || null,
      ]
    );
    added++;
  }
  console.log(`\nDone. Added ${added}, skipped ${skippedExisting} (already in the list).`);
  if (hold) {
    console.log(
      "These are held out of broadcasts (consent=FALSE). Send a re-permission email, then flip consent when they opt in."
    );
  }
} catch (err) {
  console.error("Import failed:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
