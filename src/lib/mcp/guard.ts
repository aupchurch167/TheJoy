import { McpToolError } from "./errors";
import type { ToolScope } from "./scopes";

/**
 * Tool names that would send, schedule, or test-send are rejected at registry
 * build time. Preview and draft tools do not match.
 */
const FORBIDDEN_NAME = /(send|schedule|test[-_]?send)/i;

export function assertToolNameAllowed(name: string): void {
  if (FORBIDDEN_NAME.test(name)) {
    throw new Error(`MCP tool name is not allowed: ${name}`);
  }
}

export type NamedTool = { name: string; scope: ToolScope };

/** Every registered tool must be draft-safe. Called when the registry is built. */
export function assertToolsAreDraftOnly(tools: NamedTool[]): void {
  const names = new Set<string>();
  for (const tool of tools) {
    assertToolNameAllowed(tool.name);
    if (names.has(tool.name)) throw new Error(`Duplicate MCP tool: ${tool.name}`);
    names.add(tool.name);
  }
}

export type DraftShape = {
  id: string;
  status: string;
  scheduled_at: string | null;
};

/**
 * MCP creates must come back as an unscheduled draft. If they do not, the
 * caller reverts the row and this throws so the bot never hears success.
 */
export function assertDraftRow(row: DraftShape): void {
  if (row.status === "draft" && !row.scheduled_at) return;
  throw new McpToolError(
    "Refusing to keep a broadcast that is not an unscheduled draft."
  );
}

export async function guardCreatedDraft(
  row: DraftShape,
  revert: (id: string) => Promise<void>
): Promise<void> {
  if (row.status === "draft" && !row.scheduled_at) return;
  await revert(row.id);
  assertDraftRow(row);
}
