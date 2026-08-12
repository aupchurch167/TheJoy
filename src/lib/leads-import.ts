/**
 * Parse a pasted or uploaded CSV of OLD leads (that did not come from the
 * website) into clean rows for the leads-audience import. Same field rules and
 * "import[:channel]" source convention as scripts/import-leads.mjs.
 *
 * Two modes:
 *  - Auto: header names are matched to fields by alias (used by the CLI).
 *  - Mapped: the admin upload inspects the file's headers, lets the operator
 *    map each field to a column, and passes that map in. This is what makes
 *    real-world exports (APFM, CRMs) import without renaming columns first.
 *
 * Client-safe (pure string work), so the admin panel can inspect headers and
 * preview counts before anything touches the database.
 */

export type CleanLead = {
  /** Never empty: leads.name is NOT NULL, so a nameless row falls back to the
   *  email's local part. */
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  /** "import" or "import:<channel>" (from a per-row source column). */
  source: string;
  /** ISO original date when the row supplied one; null falls back to now(). */
  createdAt: string | null;
  /** The senior the inquiry is about (the lead is usually the adult child). */
  residentName: string | null;
  /** Lifecycle stage; null falls back to the DB default ('new'). */
  stage: LeadStage | null;
};

export type LeadStage = "new" | "toured" | "moved_in" | "lost";

export type ParsedLeads = {
  rows: CleanLead[];
  total: number; // data rows seen (excluding header)
  noEmail: number;
  badEmail: number;
  dupeInFile: number;
};

/** Fields the importer understands. `name` may also be composed from first+last. */
export type LeadFieldKey =
  | "name"
  | "first"
  | "last"
  | "email"
  | "phone"
  | "source"
  | "date"
  | "message"
  | "resident"
  | "stage";

/** Field -> column index in the file (missing = not mapped). */
export type LeadColumnMap = Partial<Record<LeadFieldKey, number>>;

export type CsvInspection = {
  /** Trimmed header cells, in file order. */
  headers: string[];
  /** Raw data rows (cells), for a preview. */
  rows: string[][];
  /** Best-guess field -> column mapping from the headers. */
  guess: LeadColumnMap;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_ALIASES: Record<LeadFieldKey, string[]> = {
  name: ["name", "full name", "fullname", "contact name", "contact"],
  first: ["first name", "firstname", "first", "given name"],
  last: ["last name", "lastname", "last", "surname", "family name"],
  email: ["email address", "email", "e-mail", "e mail"],
  phone: ["phone number", "phone", "mobile", "cell", "telephone", "number"],
  source: ["lead source", "source", "channel", "origin", "referrer"],
  date: ["created at", "created_at", "signup date", "date created", "created", "date", "added", "inquiry date"],
  message: ["message", "notes", "note", "comments", "comment"],
  resident: ["resident name", "resident", "senior", "prospect", "patient", "care recipient", "for whom"],
  stage: ["stage", "status", "lead status", "lifecycle", "disposition", "pipeline"],
};

/**
 * Normalize a free-text stage/status value to one of the four lifecycle stages.
 * Unrecognized values return null (the row keeps the DB default, 'new').
 */
export function normalizeStage(raw: string): LeadStage | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (/(moved|move.?in|admitted|resident|closed.?won|\bwon\b|placed|move in)/.test(s))
    return "moved_in";
  if (/(tour|toured|visit|visited|appointment|scheduled)/.test(s)) return "toured";
  if (/(lost|closed.?lost|dead|declin|not interested|disqualif|unqualif|no longer|cancel)/.test(s))
    return "lost";
  if (/(new|inquir|lead|open|prospect|contact|active)/.test(s)) return "new";
  return null;
}

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

function nameFromEmail(email: string): string {
  return email.split("@")[0] || email;
}

/**
 * Find an unclaimed column for a field by matching header aliases (exact match
 * first, then substring), skipping columns already taken by another field.
 */
function guessCol(
  headersLower: string[],
  aliases: string[],
  taken: Set<number>
): number {
  for (const a of aliases) {
    for (let i = 0; i < headersLower.length; i++) {
      if (!taken.has(i) && headersLower[i] === a) return i;
    }
  }
  for (const a of aliases) {
    for (let i = 0; i < headersLower.length; i++) {
      if (!taken.has(i) && headersLower[i].includes(a)) return i;
    }
  }
  return -1;
}

// Assign specific fields before generic ones (email before name, etc.) and
// never map two fields to the same column, so a "Contact Email" header is not
// also claimed as the name.
const GUESS_ORDER: LeadFieldKey[] = [
  "email",
  "date",
  "phone",
  "source",
  "stage",
  "resident",
  "first",
  "last",
  "message",
  "name",
];

/** Best-guess mapping from header names. Only sets fields it finds. */
export function guessLeadMapping(headers: string[]): LeadColumnMap {
  const lower = headers.map((h) => h.trim().toLowerCase());
  const taken = new Set<number>();
  const map: LeadColumnMap = {};
  for (const key of GUESS_ORDER) {
    const i = guessCol(lower, FIELD_ALIASES[key], taken);
    if (i >= 0) {
      map[key] = i;
      taken.add(i);
    }
  }
  return map;
}

/** Read the header row + data rows + a guessed mapping (for the mapping UI). */
export function inspectLeadsCsv(text: string): CsvInspection {
  const matrix = parseMatrix(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (!matrix.length) return { headers: [], rows: [], guess: {} };
  const headers = matrix[0].map((h) => h.trim());
  const rows = matrix.slice(1);
  return { headers, rows, guess: guessLeadMapping(headers) };
}

/** Read a mapped cell (trimmed), or "" when the field is unmapped/out of range. */
function cell(row: string[], idx: number | undefined): string {
  if (idx === undefined || idx < 0 || idx >= row.length) return "";
  return (row[idx] ?? "").trim();
}

/**
 * Parse the CSV into clean rows. When `map` is given, columns are read by that
 * mapping; otherwise the mapping is guessed from the header names.
 */
export function parseLeadsCsv(
  text: string,
  baseSource = "import",
  map?: LeadColumnMap
): ParsedLeads {
  const { headers, rows } = inspectLeadsCsv(text);
  if (!headers.length) {
    return { rows: [], total: 0, noEmail: 0, badEmail: 0, dupeInFile: 0 };
  }
  const m = map ?? guessLeadMapping(headers);
  const base = slugChannel(baseSource) || "import";

  const seen = new Set<string>();
  const out: CleanLead[] = [];
  let noEmail = 0;
  let badEmail = 0;
  let dupeInFile = 0;

  for (const r of rows) {
    const email = cell(r, m.email).toLowerCase();
    const composed = [cell(r, m.first), cell(r, m.last)]
      .filter(Boolean)
      .join(" ")
      .trim();
    const name = cell(r, m.name) || composed;
    const phone = cell(r, m.phone);
    const channel = cell(r, m.source);
    const message = cell(r, m.message);
    const dateRaw = cell(r, m.date);
    const residentName = cell(r, m.resident);
    const stage = normalizeStage(cell(r, m.stage));

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

    out.push({
      name: name || nameFromEmail(email),
      email,
      phone: phone || null,
      message: message || null,
      source: channel ? `${base}:${slugChannel(channel)}` : base,
      createdAt: toIso(dateRaw),
      residentName: residentName || null,
      stage,
    });
  }

  return { rows: out, total: rows.length, noEmail, badEmail, dupeInFile };
}
