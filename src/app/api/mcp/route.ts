import { handleMcpHttp } from "@/lib/mcp/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Joy Admin MCP. Bearer keys only. This route does not start an admin session.
 * Stateless streamable HTTP: POST JSON-RPC. GET and DELETE are refused.
 */
async function handle(request: Request): Promise<Response> {
  return handleMcpHttp(request);
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
