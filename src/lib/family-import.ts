/**
 * Parse pasted or uploaded family-contact text into rows. Forgiving on purpose
 * so an operator can paste a CSV (with or without a header) or a tab-separated
 * copy out of a spreadsheet.
 *
 * Recognized fields: resident name, relation, contact name, phone, email, and
 * (optional) a contact preference used only to honor "Do Not Contact".
 */

export type ParsedContact = {
  resident_name: string;
  relation: string;
  name: string;
  phone: string;
  email: string;
  doNotContact: boolean;
};

/** Split one delimited line, honoring simple double-quoted fields. */
function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let field = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; }
        else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === delim) { out.push(field); field = ""; }
    else field += c;
  }
  out.push(field);
  return out.map((s) => s.trim());
}

const HEADER_HINTS = ["resident", "relation", "contact", "name", "phone", "email", "number"];

function matchColumn(header: string[]): {
  resident: number; relation: number; name: number; phone: number; email: number; pref: number;
} {
  const idx = { resident: -1, relation: -1, name: -1, phone: -1, email: -1, pref: -1 };
  header.forEach((raw, i) => {
    const h = raw.toLowerCase();
    if (idx.resident < 0 && h.includes("resident")) idx.resident = i;
    else if (idx.relation < 0 && (h.includes("relation") || h === "relationship")) idx.relation = i;
    else if (idx.email < 0 && h.includes("email")) idx.email = i;
    else if (idx.phone < 0 && (h.includes("phone") || h.includes("number") || h.includes("mobile") || h.includes("cell"))) idx.phone = i;
    else if (idx.pref < 0 && h.includes("preference")) idx.pref = i;
    else if (idx.name < 0 && (h.includes("contact") || h.includes("name"))) idx.name = i;
  });
  return idx;
}

export function parseFamilyContacts(text: string): ParsedContact[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "");
  if (lines.length === 0) return [];

  // Detect delimiter from the first line (tab preferred, then comma).
  const first = lines[0];
  const delim = first.includes("\t") ? "\t" : ",";

  const firstCells = splitLine(first, delim).map((c) => c.toLowerCase());
  const looksLikeHeader = firstCells.some((c) => HEADER_HINTS.some((h) => c.includes(h)));

  let cols = { resident: 0, relation: 1, name: 2, phone: 3, email: 4, pref: 5 };
  let start = 0;
  if (looksLikeHeader) {
    cols = matchColumn(splitLine(first, delim));
    start = 1;
  }

  const get = (row: string[], i: number) => (i >= 0 && i < row.length ? row[i].trim() : "");

  const rows: ParsedContact[] = [];
  for (let i = start; i < lines.length; i++) {
    const cells = splitLine(lines[i], delim);
    const name = get(cells, cols.name);
    // A row needs at least a contact name to be usable.
    if (!name) continue;
    const pref = get(cells, cols.pref).toLowerCase();
    rows.push({
      resident_name: get(cells, cols.resident),
      relation: get(cells, cols.relation),
      name,
      phone: get(cells, cols.phone),
      email: get(cells, cols.email).toLowerCase(),
      doNotContact: pref.includes("do not contact"),
    });
  }
  return rows;
}
