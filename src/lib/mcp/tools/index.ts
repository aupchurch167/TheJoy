import { assertToolsAreDraftOnly } from "../guard";
import type { McpTool } from "../execute";
import { emailTools } from "./emails";
import { textTools } from "./texts";

/**
 * Tool modules. PR A registers email and text drafts.
 * PR B adds events, partners, and families by appending a module here.
 * PR C adds feedback prepare and read tools the same way.
 */
const modules: Array<() => McpTool[]> = [emailTools, textTools];

export function allTools(): McpTool[] {
  const tools = modules.flatMap((load) => load());
  assertToolsAreDraftOnly(tools);
  return tools;
}
