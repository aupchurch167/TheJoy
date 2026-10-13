import { createHash, timingSafeEqual } from "node:crypto";
import { isMcpScope, type McpScope } from "./scopes";

/**
 * A bot principal. This is not an admin session: it has no email, no cookie,
 * and it is never accepted by requireAdmin.
 */
export type McpPrincipal = {
  kind: "mcp";
  name: string;
  scopes: McpScope[];
};

export type McpKey = {
  name: string;
  hash: string;
  scopes: McpScope[];
};

export type KeysResult =
  | { ok: true; keys: McpKey[] }
  | { ok: false; status: 503; error: string };

const NAME_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const HASH_RE = /^[0-9a-f]{64}$/;

/** SHA-256 hex of a raw key. The server stores and compares only this. */
export function hashMcpKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Constant-time compare of two SHA-256 hex digests. Returns false (no throw)
 * when either side is not 32 bytes.
 */
export function hashesEqual(a: string, b: string): boolean {
  if (!HASH_RE.test(a) || !HASH_RE.test(b)) return false;
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function normalizeKey(entry: unknown): McpKey | null {
  if (!entry || typeof entry !== "object") return null;
  const row = entry as Record<string, unknown>;
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const hash = typeof row.hash === "string" ? row.hash.trim().toLowerCase() : "";
  if (!NAME_RE.test(name) || !HASH_RE.test(hash)) return null;
  const rawScopes = Array.isArray(row.scopes) ? row.scopes : [];
  const scopes: McpScope[] = [];
  for (const scope of rawScopes) {
    if (typeof scope !== "string" || !isMcpScope(scope)) continue;
    if (!scopes.includes(scope)) scopes.push(scope);
  }
  if (scopes.includes("*")) return { name, hash, scopes: ["*"] };
  if (scopes.length === 0) return null;
  return { name, hash, scopes };
}

/** Parse JOY_MCP_KEYS. Unset, invalid JSON, or no usable keys is a 503. */
export function parseMcpKeys(raw: string | undefined): KeysResult {
  if (raw == null || raw.trim() === "") {
    return { ok: false, status: 503, error: "JOY_MCP_KEYS is not configured." };
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, status: 503, error: "JOY_MCP_KEYS is not valid JSON." };
  }
  if (!Array.isArray(data)) {
    return { ok: false, status: 503, error: "JOY_MCP_KEYS must be a JSON array." };
  }
  const keys: McpKey[] = [];
  for (const entry of data) {
    const key = normalizeKey(entry);
    if (key) keys.push(key);
  }
  if (keys.length === 0) {
    return { ok: false, status: 503, error: "JOY_MCP_KEYS has no usable keys." };
  }
  return { ok: true, keys };
}

export function readMcpKeys(env: NodeJS.ProcessEnv = process.env): KeysResult {
  return parseMcpKeys(env.JOY_MCP_KEYS);
}

/** Pull the token out of `Authorization: Bearer <key>`. Anything else is null. */
export function bearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(authorization);
  return match?.[1] ?? null;
}

export type AuthResult =
  | { ok: true; principal: McpPrincipal }
  | { ok: false; error: string };

/**
 * Hash the presented token once, then compare it to every stored hash without
 * returning early, so a match is not faster than a miss.
 */
export function authenticateBearer(
  authorization: string | null,
  keys: McpKey[]
): AuthResult {
  const token = bearerToken(authorization);
  if (!token) return { ok: false, error: "Unauthorized." };
  const presented = hashMcpKey(token);
  let match: McpKey | null = null;
  for (const key of keys) {
    if (hashesEqual(presented, key.hash)) match = key;
  }
  if (!match) return { ok: false, error: "Unauthorized." };
  return {
    ok: true,
    principal: { kind: "mcp", name: match.name, scopes: match.scopes },
  };
}
