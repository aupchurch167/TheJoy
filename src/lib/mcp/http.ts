import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { truncateAuditValue, writeAudit, type NewAudit } from "./audit";
import { authenticateBearer, hashMcpKey, readMcpKeys } from "./auth";
import type { McpTool } from "./execute";
import { pgIdempotency, type IdempotencyStore } from "./idempotency";
import { consumeRateLimit } from "./rate-limit";
import { buildMcpServer } from "./server";
import { allTools } from "./tools";

export type McpRuntime = {
  audit: (row: NewAudit) => Promise<void>;
  tools: McpTool[];
  idempotency: IdempotencyStore;
  now: () => number;
};

export function defaultMcpRuntime(): McpRuntime {
  return {
    audit: (row) => writeAudit(row),
    tools: allTools(),
    idempotency: pgIdempotency,
    now: () => Date.now(),
  };
}

function json(status: number, body: unknown, extra?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...extra,
    },
  });
}

async function peekCall(request: Request): Promise<{ tool: string; args: unknown }> {
  if (request.method !== "POST") return { tool: request.method.toLowerCase(), args: {} };
  try {
    const body = (await request.clone().json()) as {
      method?: unknown;
      params?: { name?: unknown; arguments?: unknown };
    };
    if (body?.method === "tools/call") {
      const name = typeof body.params?.name === "string" ? body.params.name : "tools/call";
      return { tool: name.slice(0, 80), args: truncateAuditValue(body.params?.arguments ?? {}) };
    }
    const method = typeof body?.method === "string" ? body.method : "unknown";
    return { tool: method.slice(0, 80), args: {} };
  } catch {
    return { tool: "unknown", args: {} };
  }
}

/**
 * Streamable HTTP, stateless: one server and one transport per request.
 * A key is not an admin session. This function never reads or writes a cookie.
 */
export async function handleMcpHttp(
  request: Request,
  runtime: McpRuntime = defaultMcpRuntime()
): Promise<Response> {
  const keys = readMcpKeys();
  if (!keys.ok) {
    const peeked = await peekCall(request);
    await runtime.audit({
      keyName: null,
      tool: peeked.tool,
      args: {},
      ok: false,
      error: keys.error,
      resultRef: null,
    });
    return json(503, { error: keys.error });
  }

  const authorization = request.headers.get("authorization");
  const auth = authenticateBearer(authorization, keys.keys);
  if (!auth.ok) {
    const peeked = await peekCall(request);
    const token = authorization?.replace(/^Bearer\s+/i, "").trim();
    const bucket = token ? `authfail:${hashMcpKey(token)}` : "authfail:none";
    const limited = consumeRateLimit(bucket, runtime.now());
    if (!limited.ok) {
      await runtime.audit({
        keyName: null,
        tool: peeked.tool,
        args: {},
        ok: false,
        error: "Rate limit exceeded.",
        resultRef: null,
      });
      return json(429, { error: "Rate limit exceeded. Try again in a minute." }, {
        "retry-after": String(limited.retryAfterSec),
      });
    }
    await runtime.audit({
      keyName: null,
      tool: peeked.tool,
      args: {},
      ok: false,
      error: "Unauthorized.",
      resultRef: null,
    });
    return json(401, { error: "Unauthorized." }, {
      "www-authenticate": 'Bearer realm="joy-mcp"',
    });
  }

  const limited = consumeRateLimit(auth.principal.name, runtime.now());
  const peeked = await peekCall(request);
  if (!limited.ok) {
    await runtime.audit({
      keyName: auth.principal.name,
      tool: peeked.tool,
      args: peeked.args,
      ok: false,
      error: "Rate limit exceeded.",
      resultRef: null,
    });
    return json(429, { error: "Rate limit exceeded. Try again in a minute." }, {
      "retry-after": String(limited.retryAfterSec),
    });
  }

  if (request.method !== "POST") {
    return json(
      405,
      { error: "Method not allowed. This server is stateless. POST JSON-RPC." },
      { allow: "POST" }
    );
  }

  const server = buildMcpServer(auth.principal, runtime.tools, {
    audit: runtime.audit,
    idempotency: runtime.idempotency,
  });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    maxRequestBodySize: 1_000_000,
  });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    const text = await response.text();
    const headers = new Headers(response.headers);
    headers.set("cache-control", "no-store");
    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } finally {
    await transport.close().catch(() => undefined);
    await server.close().catch(() => undefined);
  }
}
