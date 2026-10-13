/**
 * Scopes a Joy MCP key can hold. `*` grants every scope, including ones added
 * in later PRs. A tool names the single scope it requires.
 */
export const MCP_SCOPES = [
  "emails",
  "texts",
  "events",
  "partners",
  "families",
  "feedback",
  "team-feedback",
  "read",
  "*",
] as const;

export type McpScope = (typeof MCP_SCOPES)[number];

/** A tool must name a real scope. `*` is a key grant, not a tool requirement. */
export type ToolScope = Exclude<McpScope, "*">;

const SCOPE_SET = new Set<string>(MCP_SCOPES);

export function isMcpScope(value: string): value is McpScope {
  return SCOPE_SET.has(value);
}

export function hasScope(scopes: readonly string[], required: ToolScope): boolean {
  return scopes.includes("*") || scopes.includes(required);
}
