// Import existing Webflow blog posts into Postgres and build 301 redirects.
//
// Usage:
//   node scripts/import-webflow.mjs <export.csv|export.json> [--dry]
//
// Accepts a Webflow CMS export (CSV, the usual export format) or a JSON array.
// It preserves slugs, converts rich-text HTML to Markdown, upserts each post,
// and writes db/redirects.json so old URLs 301 to the new /blog/<slug> paths.
//
// Env:
//   DATABASE_URL      required (unless --dry)
//   OLD_BLOG_BASE     old URL base for posts (default "/post"); used to build
//                     redirects. Set to whatever Webflow used (e.g. "/blog").
//
// Field mapping is forgiving: column names are matched case-insensitively
// against common Webflow headers (Name/Title, Slug, Post Body, Summary, etc.).

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import TurndownService from "turndown";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const file = process.argv[2];
const dry = process.argv.includes("--dry");
const OLD_BLOG_BASE = (process.env.OLD_BLOG_BASE || "/post").replace(/\/$/, "");

if (!file) {
  console.error("Usage: node scripts/import-webflow.mjs <export.csv|json> [--dry]");
  process.exit(1);
}

const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });

/* ---------------- parsing ---------------- */

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r") {
      // ignore
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const header = rows.shift().map((h) => h.trim());
  return rows
    .filter((r) => r.some((v) => v.trim() !== ""))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

function pick(obj, names) {
  const keys = Object.keys(obj);
  for (const name of names) {
    const k = keys.find((key) => key.toLowerCase() === name.toLowerCase());
    if (k && String(obj[k]).trim() !== "") return String(obj[k]).trim();
  }
  return "";
}

// For titles: derive a tidy slug and cap the length.
function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// For an existing (Webflow) slug: normalize but DO NOT truncate, so migrated
// URLs match the old ones exactly and the 301 redirects line up.
function normalizeSlug(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ---------------- load + normalize ---------------- */

const raw = readFileSync(file, "utf8");
const records = file.endsWith(".json") ? JSON.parse(raw) : parseCSV(raw);

const isTrue = (v) => String(v).trim().toLowerCase() === "true";

let skippedArchived = 0;
let skippedDraft = 0;

const posts = records
  .map((r) => {
    // Skip archived or draft rows (Webflow exports include them).
    if (isTrue(pick(r, ["Archived"]))) {
      skippedArchived++;
      return null;
    }
    if (isTrue(pick(r, ["Draft"]))) {
      skippedDraft++;
      return null;
    }

    const title = pick(r, ["Name", "Title", "Blog Post - Title"]);
    if (!title) return null;

    // "Blog Post - Link" is the Webflow slug field. Preserve it verbatim (no
    // truncation) so the new URL matches the old one; only fall back to a
    // title-derived slug when no slug column is present.
    const rawSlug = pick(r, ["Slug", "Blog Post - Link"]);
    const slug = rawSlug ? normalizeSlug(rawSlug) : slugify(title);

    const bodyHtml = pick(r, [
      "Post Body",
      "Body",
      "Content",
      "Post Content",
      "Blog Post - Richt Text", // (Webflow's typo, kept verbatim)
      "Blog Post - Rich Text",
      "Rich Text",
    ]);
    const body = bodyHtml ? td.turndown(bodyHtml) : "";

    const excerpt = pick(r, [
      "Post Summary",
      "Summary",
      "Excerpt",
      "Meta Description",
      "Blog Post - Short Description (Page)",
      "Blog Post - Small Excerpt (Card)",
      "Blog Post - Large Excerpt (Card)",
    ]);

    const hero = pick(r, [
      "Main Image",
      "Thumbnail image",
      "Hero Image",
      "Image",
      "Blog Post - Featured Image (Page, Featured Card)",
      "Blog Post - Thumbnail Image (Card)",
    ]);

    const category = pick(r, ["Category", "Collection", "Blog Post - Category"]);
    const author = pick(r, ["Author", "Blog Post - Author"]);

    const publishedAtRaw = pick(r, [
      "Published On",
      "Published",
      "Created On",
      "Publish Date",
      "Date",
    ]);
    const publishedAt = publishedAtRaw
      ? new Date(publishedAtRaw).toISOString()
      : null;

    const oldPath =
      pick(r, ["Old Path", "old_path"]) || `${OLD_BLOG_BASE}/${slug}`;

    return { title, slug, body, excerpt, hero, category, author, publishedAt, oldPath };
  })
  .filter(Boolean);

console.log(
  `Parsed ${posts.length} post(s) from ${file}` +
    (skippedArchived || skippedDraft
      ? ` (skipped ${skippedArchived} archived, ${skippedDraft} draft).`
      : ".")
);

/* ---------------- redirects file ---------------- */

const redirects = posts
  .map((p) => ({ from: p.oldPath, to: `/blog/${p.slug}` }))
  .filter((r) => r.from && r.to && r.from !== r.to);

if (!dry) {
  writeFileSync(
    join(ROOT, "db", "redirects.json"),
    JSON.stringify(redirects, null, 2) + "\n"
  );
  console.log(`Wrote ${redirects.length} redirect(s) to db/redirects.json.`);
}

/* ---------------- upsert into Postgres ---------------- */

if (dry) {
  for (const p of posts) {
    console.log(`  - ${p.title}  ->  /blog/${p.slug}  (redirect from ${p.oldPath})`);
  }
  console.log("Dry run: nothing written to the database.");
  process.exit(0);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Set it, or re-run with --dry.");
  process.exit(1);
}
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

try {
  await client.connect();
  let inserted = 0;
  for (const p of posts) {
    await client.query(
      `INSERT INTO posts (slug, title, excerpt, body, hero_image, category, author, status, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'published',$8)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         excerpt = EXCLUDED.excerpt,
         body = EXCLUDED.body,
         hero_image = EXCLUDED.hero_image,
         category = EXCLUDED.category,
         author = EXCLUDED.author,
         status = 'published',
         published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
         updated_at = now()`,
      [
        p.slug,
        p.title,
        p.excerpt || null,
        p.body,
        p.hero || null,
        p.category || null,
        p.author || "Joy Senior Living",
        p.publishedAt,
      ]
    );
    // Record redirect in the DB too (for the admin record).
    if (p.oldPath && p.oldPath !== `/blog/${p.slug}`) {
      await client.query(
        `INSERT INTO redirects (from_path, to_path, status_code)
         VALUES ($1, $2, 301)
         ON CONFLICT (from_path) DO UPDATE SET to_path = EXCLUDED.to_path`,
        [p.oldPath, `/blog/${p.slug}`]
      );
    }
    inserted++;
  }
  console.log(`Imported ${inserted} post(s) into Postgres.`);
  console.log("Remember to redeploy so the redirects take effect.");
} catch (err) {
  console.error("Import failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
