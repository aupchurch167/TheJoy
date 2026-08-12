/**
 * Parse a pasted or uploaded CSV of OLD leads (that did not come from the
 * website) into clean rows for the leads-audience import. Same field rules and
 * "import[:channel]" source convention as scripts/import-leads.mjs, so the
 * admin upload and the CLI behave identically.
 *
 * Client-safe (pure string work), so the admin panel can preview counts before
 * anything touches the database.
 */

export type CleanLead = {
  name: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  /** "import" or "import:<channel>" (from a per-row source column). */
  source: string;
  /** ISO original date when the row supplied one; null falls back to now(). */
  createdAt: string | null;
};

export type ParsedLeads = {
  rows: CleanLead[];
  total: number; // data rows seen (excluding header)
  noEmail: number;
  badEmail: number;
  dupeInFile: number;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Quote-aware CSV to a matrix of string cells. */
function parseMatrix(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      /* skip */
    } else field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** First non-empty value among possible column names. */
function pick(rec: Record<string, string>, names: string[]): string {
  for (const n of names) {
    if (rec[n] !== undefined && rec[n] !== "") return rec[n];
  }
  return "";
}

/** Tidy a per-row channel into a short source suffix ("Facebook Ad" -> "facebook_ad"). */
function slugChannel(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
}

function toIso(s: string): string | null {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

export function parseLeadsCsv(text: string, baseSource = "import"): ParsedLeads {
  const matrix = parseMatrix(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (matrix.length < 1) {
    return { rows: [], total: 0, noEmail: 0, badEmail: 0, dupeInFile: 0 };
  }
  const header = matrix[0].map((h) => h.trim().toLowerCase());
  const records = matrix.slice(1).map((r) => {
    const o: Record<string, string> = {};
    header.forEach((h, i) => (o[h] = (r[i] ?? "").trim()));
    return o;
  });

  const base = slugChannel(baseSource) || "import";
  const seen = new Set<string>();
  const rows: CleanLead[] = [];
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
    const dateRaw = pick(r, [
      "date",
      "created",
      "created_at",
      "created at",
      "added",
      "signup date",
    ]);
    const message = pick(r, ["message", "notes", "note", "comment", "comments"]);

    if (!email) {
      noEmail++;
      continue;
    }
    if (!EMAIL_RE.test(email)) {
      badEmail++;
      continue;
    }
    if (seen.has(email)) {
      dupeInFile++;
      continue;
    }
    seen.add(email);

    rows.push({
      name: name || null,
      email,
      phone: phone || null,
      message: message || null,
      source: channel ? `${base}:${slugChannel(channel)}` : base,
      createdAt: toIso(dateRaw),
    });
  }

  return { rows, total: records.length, noEmail, badEmail, dupeInFile };
}
