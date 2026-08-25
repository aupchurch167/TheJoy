/**
 * Connecteam API client (roster source of truth). We only read the user
 * directory: GET https://api.connecteam.com/users/v1/users, authenticated with
 * an `X-API-KEY` header (Settings -> API keys in Connecteam). Requires the
 * Expert plan on at least one hub.
 *
 * Docs: https://developer.connecteam.com/docs/read-users-data
 */

const BASE = "https://api.connecteam.com";
const USERS_PATH = "/users/v1/users";
const PAGE_LIMIT = 200; // API allows up to 500; 200 keeps each response modest.

export function connecteamEnabled(): boolean {
  return !!process.env.CONNECTEAM_API_KEY;
}

/** A user as it matters to us, normalized from the Connecteam shape. */
export type ConnecteamUser = {
  externalId: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  archived: boolean;
  /** YYYY-MM-DD, best-effort from a custom field (falls back to added date). */
  hireDate: string | null;
  /** YYYY-MM-DD from a birthday custom field, or null. */
  birthDate: string | null;
};

type RawUser = {
  userId: number | string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phoneNumber?: string | null;
  userType?: string | null;
  isArchived?: boolean;
  createdAt?: number | string;
  customFields?: { name?: string; value?: unknown }[];
};

/** Parse a custom-field date value (epoch seconds/ms or a string) to YYYY-MM-DD. */
function toIsoDate(value: unknown): string | null {
  if (value == null || value === "") return null;
  let d: Date;
  if (typeof value === "number") {
    // Heuristic: > 1e12 is ms, > 1e9 is seconds.
    const ms = value > 1e12 ? value : value > 1e9 ? value * 1000 : NaN;
    if (Number.isNaN(ms)) return null;
    d = new Date(ms);
  } else if (typeof value === "string") {
    const t = Date.parse(value);
    if (Number.isNaN(t)) return null;
    d = new Date(t);
  } else {
    return null;
  }
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function fieldByName(u: RawUser, re: RegExp): unknown {
  return (u.customFields ?? []).find((f) => re.test(f.name ?? ""))?.value;
}

type UsersResponse = {
  data?: { users?: RawUser[] };
  paging?: { offset?: number };
};

// A job title, if the account keeps one in a custom field. userType is the
// Connecteam access role (owner/manager/user), not a position, so we don't use
// it as a title.
function titleFromCustomFields(u: RawUser): string | null {
  const match = (u.customFields ?? []).find((f) =>
    /title|position|role|job/i.test(f.name ?? "")
  );
  const v = match?.value;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function normalize(u: RawUser): ConnecteamUser {
  const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
  const hireField = toIsoDate(
    fieldByName(u, /hire|start\s*date|seniority|employment|tenure/i)
  );
  return {
    externalId: String(u.userId),
    name: name || "(no name)",
    email: u.email?.trim().toLowerCase() || null,
    phone: u.phoneNumber?.trim() || null,
    title: titleFromCustomFields(u),
    archived: !!u.isArchived,
    // Prefer an explicit hire/start field; fall back to when they were added.
    hireDate: hireField ?? toIsoDate(u.createdAt),
    birthDate: toIsoDate(fieldByName(u, /birth|b-?day|dob/i)),
  };
}

export class ConnecteamError extends Error {}

async function getPage(
  apiKey: string,
  offset: number,
  includeArchived: boolean
): Promise<RawUser[]> {
  const url = new URL(BASE + USERS_PATH);
  url.searchParams.set("limit", String(PAGE_LIMIT));
  url.searchParams.set("offset", String(offset));
  // Default is active-only; ask for all so we can deactivate archived people.
  if (includeArchived) url.searchParams.set("userStatus", "all");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "X-API-KEY": apiKey, Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (err) {
    throw new ConnecteamError(
      err instanceof Error && err.name === "AbortError"
        ? "Connecteam timed out."
        : "Could not reach Connecteam."
    );
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 || res.status === 403) {
    throw new ConnecteamError(
      "Connecteam rejected the API key (check the key and that the hub is on the Expert plan)."
    );
  }
  if (!res.ok) {
    throw new ConnecteamError(`Connecteam returned ${res.status}.`);
  }
  const body = (await res.json()) as UsersResponse;
  return body.data?.users ?? [];
}

/**
 * Fetch the whole user directory, following pagination. Returns everyone
 * (including archived) so a sync can deactivate people who left.
 */
export async function fetchConnecteamUsers(
  opts: { includeArchived?: boolean } = {}
): Promise<ConnecteamUser[]> {
  const apiKey = process.env.CONNECTEAM_API_KEY;
  if (!apiKey) throw new ConnecteamError("CONNECTEAM_API_KEY is not set.");
  const includeArchived = opts.includeArchived ?? true;

  const all: ConnecteamUser[] = [];
  for (let offset = 0; ; offset += PAGE_LIMIT) {
    const page = await getPage(apiKey, offset, includeArchived);
    all.push(...page.map(normalize));
    if (page.length < PAGE_LIMIT) break; // last page
    if (offset > 20_000) break; // safety valve against a runaway loop
  }
  return all;
}
