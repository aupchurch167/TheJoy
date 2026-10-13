import { query } from "../db";

export type NewAudit = {
  keyName: string | null;
  tool: string;
  args: unknown;
  ok: boolean;
  error: string | null;
  resultRef: string | null;
};

export type McpAuditRow = {
  id: string;
  at: string;
  key_name: string | null;
  tool: string | null;
  args: unknown;
  ok: boolean;
  error: string | null;
  result_ref: string | null;
};

const STRING_MAX = 500;

/** Shorten long strings (email and text bodies) before they land in mcp_audit. */
export function truncateAuditValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[truncated]";
  if (typeof value === "string") {
    if (value.length <= STRING_MAX) return value;
    const extra = value.length - STRING_MAX;
    return `${value.slice(0, STRING_MAX)}…[truncated ${extra} chars]`;
  }
  if (typeof value === "number" || typeof value === "boolean" || value == null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => truncateAuditValue(item, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      out[key] = truncateAuditValue(inner, depth + 1);
    }
    return out;
  }
  return String(value);
}

type Exec = (text: string, params?: unknown[]) => Promise<unknown>;

/** Insert one audit row. A database failure is logged and swallowed. */
export async function writeAudit(row: NewAudit, exec: Exec = query): Promise<void> {
  const args = truncateAuditValue(row.args ?? {});
  try {
    await exec(
      `INSERT INTO mcp_audit (key_name, tool, args, ok, error, result_ref)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6)`,
      [
        row.keyName,
        row.tool.slice(0, 80),
        JSON.stringify(args),
        row.ok,
        row.error ? row.error.slice(0, 500) : null,
        row.resultRef ? row.resultRef.slice(0, 200) : null,
      ]
    );
  } catch (err) {
    console.error("[mcp] audit failed", err);
  }
}

export async function listRecentMcpAudit(limit = 100): Promise<McpAuditRow[]> {
  return query<McpAuditRow>(
    `SELECT id, at, key_name, tool, args, ok, error, result_ref
       FROM mcp_audit
      ORDER BY at DESC
      LIMIT $1`,
    [Math.min(Math.max(limit, 1), 200)]
  );
}

/** User-facing tool errors are stored as-is. Unexpected errors stay generic. */
export function auditErrorMessage(err: unknown): string {
  if (err instanceof Error && err.name === "McpToolError") return err.message;
  return "Something went wrong.";
}
