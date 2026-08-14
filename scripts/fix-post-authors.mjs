// One-off cleanup of blog post AUTHOR bylines so schema.org author @type is
// correct (Person only for real Joy people, Organization for the company) and
// the E-E-A-T signal is put to work.
//
// What it does (dry run by default; nothing writes until --commit):
//   1. Reassigns cross-contaminated bylines (e.g. "Nick Demarco", a project
//      manager from another company) to the organization, "Joy Senior Living".
//   2. Normalizes bare first names from the old import ("Mellissa" -> "Mellissa
//      Daniel", "Adam" -> "Adam Upchurch") so they match the real Person.
//   3. With --mellissa-care, credits Mellissa Daniel (RN) on care and
//      memory-care posts (matched by category/slug/title), because an RN byline
//      on the dementia cluster is worth more than any backlink.
//
// The schema @type itself is fixed in code (src/lib/schema.ts): any author that
// is not a known real person renders as Organization. This script fixes the
// stored NAME so the visible byline and the Person crediting are right too.
//
// Usage:
//   node scripts/fix-post-authors.mjs                 # dry run, show the plan
//   node scripts/fix-post-authors.mjs --commit        # apply items 1 and 2
//   node scripts/fix-post-authors.mjs --mellissa-care --commit
//
// Env:
//   DATABASE_URL   required
//   PGSSL          "false" to disable TLS (local Postgres)

import pg from "pg";

const args = process.argv.slice(2);
const commit = args.includes("--commit");
const mellissaCare = args.includes("--mellissa-care");

const ORG = "Joy Senior Living";
const MELLISSA = "Mellissa Daniel";
const ADAM = "Adam Upchurch";

// Bylines that belong to no Joy author (cross-contamination from other work).
const NOT_OUR_AUTHOR = [/^nick\s+demarco$/i, /^nick-demarco$/i];

// Care / memory-care topics, matched against category, slug, and title.
const CARE_TOPIC =
  /(memory\s*care|memory-care|dementia|alzheimer|cognit|caregiv|sundown|hospice|end.of.life|when.its.time)/i;

function normalizeName(a) {
  const s = (a || "").trim();
  if (/^mellissa$/i.test(s) || /^mellissa\s+daniel$/i.test(s)) return MELLISSA;
  if (/^adam$/i.test(s) || /^adam\s+upchurch$/i.test(s)) return ADAM;
  return s;
}

/** Decide the correct author for a post, or null to leave it unchanged. */
function proposeAuthor(p) {
  const current = (p.author || "").trim();

  // 1. Not one of our people -> organization.
  if (NOT_OUR_AUTHOR.some((re) => re.test(current))) return ORG;

  // 2. Normalize bare first names to the real person.
  const normalized = normalizeName(current);
  if (normalized !== current) return normalized;

  // 3. Optionally credit Mellissa on care-topic posts (unless already a person).
  if (mellissaCare && normalized !== MELLISSA && normalized !== ADAM) {
    const hay = `${p.category || ""} ${p.slug || ""} ${p.title || ""}`;
    if (CARE_TOPIC.test(hay)) return MELLISSA;
  }

  return null;
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required.");
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

try {
  const { rows: posts } = await pool.query(
    `SELECT id, slug, title, category, author FROM posts ORDER BY created_at`
  );

  // Current author breakdown.
  const counts = {};
  for (const p of posts) counts[p.author || "(none)"] = (counts[p.author || "(none)"] || 0) + 1;
  console.log(`\n${posts.length} posts. Current authors:`);
  for (const [a, n] of Object.entries(counts).sort((x, y) => y[1] - x[1])) {
    console.log(`  ${n.toString().padStart(3)}  ${a}`);
  }

  const changes = [];
  for (const p of posts) {
    const next = proposeAuthor(p);
    if (next && next !== (p.author || "").trim()) changes.push({ p, next });
  }

  if (changes.length === 0) {
    console.log("\nNothing to change.");
    if (!mellissaCare)
      console.log("Tip: pass --mellissa-care to also credit Mellissa on care-topic posts.");
  } else {
    console.log(`\n${commit ? "Applying" : "Would change"} ${changes.length} post(s):`);
    for (const { p, next } of changes) {
      console.log(`  ${p.slug}\n      "${p.author}"  ->  "${next}"`);
    }
    if (commit) {
      for (const { p, next } of changes) {
        await pool.query(`UPDATE posts SET author = $2, updated_at = now() WHERE id = $1`, [
          p.id,
          next,
        ]);
      }
      console.log(`\nDone. Updated ${changes.length} post(s).`);
    } else {
      console.log("\nDry run. Re-run with --commit to apply.");
    }
  }

  if (!mellissaCare) {
    const care = posts.filter((p) =>
      CARE_TOPIC.test(`${p.category || ""} ${p.slug || ""} ${p.title || ""}`)
    );
    if (care.length) {
      console.log(`\nCare-topic posts (candidates for a Mellissa RN byline, use --mellissa-care):`);
      for (const p of care) console.log(`  ${p.slug}  (author: ${p.author})`);
    }
  }
} finally {
  await pool.end();
}
