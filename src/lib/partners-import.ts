import {
  normalizeCategory,
  PARTNER_STATUSES,
  STATUS_LABEL,
  type PartnerCategory,
  type PartnerStatus,
  type PartnerTier,
} from "./partners-vocab";

/**
 * Pure, client-safe CSV helpers for the Partners import panel. Mirrors the
 * inspect -> map -> parse flow of lib/leads-import.ts so the panel can preview
 * before the server commits. No DB, no React.
 */

export type PartnerFieldKey =
  | "organization"
  | "category"
  | "tier"
  | "contact_name"
  | "contact_role"
  | "phone"
  | "email"
  | "status"
  | "notes";

export const PARTNER_IMPORT_FIELDS: {
  key: PartnerFieldKey;
  label: string;
  required?: boolean;
}[] = [
  { key: "organization", label: "Organization", required: true },
  { key: "category", label: "Category", required: true },
  { key: "tier", label: "Tier" },
  { key: "contact_name", label: "Contact name" },
  { key: "contact_role", label: "Role" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "status", label: "Status" },
  { key: "notes", label: "Notes" },
];

export type PartnerColumnMap = Partial<Record<PartnerFieldKey, number>>;

export type CleanPartner = {
  organization: string;
  category: PartnerCategory;
  tier: PartnerTier | null;
  contact_name: string | null;
  contact_role: string | null;
  phone: string | null;
  email: string | null;
  status: PartnerStatus;
  notes: string | null;
};

export type PartnerCsvInspection = {
  headers: string[];
  rows: string[][];
  guess: PartnerColumnMap;
};

export type ParsedPartners = {
  rows: CleanPartner[];
  total: number; // data rows seen
  noOrg: number; // skipped: no organization
  dupeInFile: number; // skipped: duplicate org within the file
};

/* ---- CSV matrix parse (quote-aware) ---- */
function parseMatrix(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const FIELD_ALIASES: Record<PartnerFieldKey, string[]> = {
  organization: ["organization", "org", "company", "facility", "hospital", "name of organization", "account"],
  category: ["category", "type", "referral type", "source type"],
  tier: ["tier", "priority", "rank"],
  contact_name: ["contact", "contact name", "name", "rep", "liaison", "case manager"],
  contact_role: ["role", "title", "position"],
  phone: ["phone", "phone number", "mobile", "cell", "tel"],
  email: ["email", "e-mail", "email address"],
  status: ["status", "stage", "pipeline"],
  notes: ["notes", "note", "comments", "comment"],
};

// Guess specific fields before generic ones so "contact name" doesn't grab the
// "organization" column via the generic "name" alias.
const GUESS_ORDER: PartnerFieldKey[] = [
  "organization",
  "email",
  "phone",
  "category",
  "tier",
  "contact_role",
  "contact_name",
  "status",
  "notes",
];

export function guessPartnerMapping(headers: string[]): PartnerColumnMap {
  const norm = headers.map((h) => h.trim().toLowerCase());
  const map: PartnerColumnMap = {};
  const claimed = new Set<number>();
  for (const field of GUESS_ORDER) {
    const aliases = FIELD_ALIASES[field];
    // exact match first, then substring
    let idx = norm.findIndex((h, i) => !claimed.has(i) && aliases.includes(h));
    if (idx === -1) {
      idx = norm.findIndex(
        (h, i) => !claimed.has(i) && aliases.some((a) => h.includes(a))
      );
    }
    if (idx !== -1) {
      map[field] = idx;
      claimed.add(idx);
    }
  }
  return map;
}

export function inspectPartnersCsv(text: string): PartnerCsvInspection {
  const matrix = parseMatrix(text);
  if (!matrix.length) return { headers: [], rows: [], guess: {} };
  const [headers, ...rows] = matrix;
  return { headers, rows, guess: guessPartnerMapping(headers) };
}

function normalizeStatus(raw: string): PartnerStatus {
  const s = (raw || "").trim().toLowerCase();
  if (!s) return "not_contacted";
  const byKey = PARTNER_STATUSES.find((k) => k === s.replace(/\s+/g, "_"));
  if (byKey) return byKey;
  const byLabel = PARTNER_STATUSES.find(
    (k) => STATUS_LABEL[k].toLowerCase() === s
  );
  if (byLabel) return byLabel;
  if (/active/.test(s)) return "active_partner";
  if (/tour/.test(s)) return "tour_scheduled";
  if (/material/.test(s)) return "materials_sent";
  if (/connect/.test(s)) return "connected";
  if (/attempt|called/.test(s)) return "attempted";
  if (/nurtur/.test(s)) return "nurture";
  if (/research|prospect/.test(s)) return "research";
  if (/closed|dead|lost/.test(s)) return "closed";
  return "not_contacted";
}

function normalizeTier(raw: string): PartnerTier | null {
  const s = (raw || "").trim().toUpperCase();
  return s === "A" || s === "B" || s === "C" ? s : null;
}

const pick = (row: string[], idx?: number): string =>
  idx === undefined ? "" : (row[idx] ?? "").trim();

export function parsePartnersCsv(
  text: string,
  map: PartnerColumnMap
): ParsedPartners {
  const { rows } = inspectPartnersCsv(text);
  const out: CleanPartner[] = [];
  const seen = new Set<string>();
  let noOrg = 0;
  let dupeInFile = 0;

  for (const row of rows) {
    const organization = pick(row, map.organization);
    if (!organization) {
      noOrg++;
      continue;
    }
    const key = organization.toLowerCase();
    if (seen.has(key)) {
      dupeInFile++;
      continue;
    }
    seen.add(key);
    out.push({
      organization,
      category: normalizeCategory(pick(row, map.category)),
      tier: normalizeTier(pick(row, map.tier)),
      contact_name: pick(row, map.contact_name) || null,
      contact_role: pick(row, map.contact_role) || null,
      phone: pick(row, map.phone) || null,
      email: pick(row, map.email) || null,
      status: normalizeStatus(pick(row, map.status)),
      notes: pick(row, map.notes) || null,
    });
  }

  return { rows: out, total: rows.length, noOrg, dupeInFile };
}
