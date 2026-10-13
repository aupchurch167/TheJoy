import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpPrincipal } from "./auth";
import { executeTool, type ExecuteDeps, type McpTool, type ToolOutcome } from "./execute";

const INSTRUCTIONS =
  "Joy admin MCP. Drafts only. You cannot send, schedule, or test-send email or text. Leads are out of scope. A draft stays unscheduled until a person sends it from the admin portal.";

function toCallResult(outcome: ToolOutcome) {
  if (!outcome.ok) {
    return {
      content: [{ type: "text" as const, text: outcome.message }],
      isError: true as const,
    };
  }
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(outcome.data, null, 2) },
    ],
  };
}

/** A fresh server per request. Tools come from the registry so later PRs can add modules. */
export function buildMcpServer(
  principal: McpPrincipal,
  tools: McpTool[],
  deps: ExecuteDeps
): McpServer {
  const server = new McpServer(
    { name: "joy-admin", version: "1.0.0" },
    { instructions: INSTRUCTIONS, maxToolInputElements: 40 }
  );
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.schema,
        annotations: tool.annotations,
      },
      async (args) => toCallResult(await executeTool(tool, args, principal, deps))
    );
  }
  return server;
}
