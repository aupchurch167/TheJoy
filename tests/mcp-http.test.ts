import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { hashMcpKey } from "../src/lib/mcp/auth";
import { handleMcpHttp, type McpRuntime } from "../src/lib/mcp/http";
import { createMemoryIdempotency } from "../src/lib/mcp/idempotency";
import { resetRateLimits } from "../src/lib/mcp/rate-limit";
import { allTools } from "../src/lib/mcp/tools/index";
import type { NewAudit } from "../src/lib/mcp/audit";

const RAW = "http-test-key";
const saved = process.env.JOY_MCP_KEYS;

function envFor(scopes: string[], name = "data") {
  process.env.JOY_MCP_KEYS = JSON.stringify([
    { name, hash: hashMcpKey(RAW), scopes },
  ]);
}

function runtime(scopesNote?: string): McpRuntime & { audits: NewAudit[] } {
  const audits: NewAudit[] = [];
  return {
    audits,
    audit: async (row) => {
      audits.push(row);
    },
    tools: allTools(),
    idempotency: createMemoryIdempotency(),
    now: () => 1_700_000_000_000,
    ...(scopesNote ? {} : {}),
  };
}

function post(method: string, params: unknown, token = RAW): Request {
  return new Request("https://www.joyseniorcare.com/api/mcp", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
}

beforeEach(() => {
  resetRateLimits();
});

afterEach(() => {
  if (saved == null) delete process.env.JOY_MCP_KEYS;
  else process.env.JOY_MCP_KEYS = saved;
  resetRateLimits();
});

describe("MCP HTTP", () => {
  it("returns 503 when keys are unset and audits the denial", async () => {
    delete process.env.JOY_MCP_KEYS;
    const rt = runtime();
    const res = await handleMcpHttp(post("tools/list", {}), rt);
    assert.equal(res.status, 503);
    const body = (await res.json()) as { error: string };
    assert.match(body.error, /not configured/);
    assert.equal(rt.audits[0]?.ok, false);
    assert.equal(rt.audits[0]?.keyName, null);
  });

  it("returns 401 for a bad key without echoing it", async () => {
    envFor(["*"], "joy-coo");
    const rt = runtime();
    const secret = "not-a-real-key";
    const res = await handleMcpHttp(post("tools/list", {}, secret), rt);
    assert.equal(res.status, 401);
    const text = await res.text();
    assert.equal(text.includes(secret), false);
    assert.equal(rt.audits[0]?.error, "Unauthorized.");
    assert.equal(rt.audits[0]?.keyName, null);
  });

  it("lists draft tools and denies a read key that calls emails", async () => {
    envFor(["read"], "data");
    const rt = runtime();
    const listed = await handleMcpHttp(post("tools/list", {}), rt);
    assert.equal(listed.status, 200);
    const listBody = (await listed.json()) as {
      result: { tools: { name: string; inputSchema: { type: string; properties?: object } }[] };
    };
    const names = listBody.result.tools.map((tool) => tool.name);
    assert.ok(names.includes("emails_create_draft"));
    assert.ok(names.includes("texts_preview_recipients"));
    assert.equal(names.some((name) => /send|schedule/.test(name)), false);
    const create = listBody.result.tools.find((tool) => tool.name === "emails_create_draft");
    assert.equal(create?.inputSchema.type, "object");
    assert.ok(create?.inputSchema.properties && "subject" in create.inputSchema.properties);
    assert.ok(create?.inputSchema.properties && "body" in create.inputSchema.properties);

    const denied = await handleMcpHttp(
      post("tools/call", { name: "emails_list_drafts", arguments: {} }),
      rt
    );
    assert.equal(denied.status, 200);
    const deniedBody = (await denied.json()) as {
      result: { isError?: boolean; content: { text: string }[] };
    };
    assert.equal(deniedBody.result.isError, true);
    assert.match(deniedBody.result.content[0].text, /Missing scope: emails/);
    assert.equal(
      rt.audits.some((row) => row.tool === "emails_list_drafts" && row.ok === false),
      true
    );
  });

  it("rate limits a key at 60 calls", async () => {
    envFor(["read"], "data");
    const rt = runtime();
    for (let i = 0; i < 60; i++) {
      const res = await handleMcpHttp(post("tools/list", {}), rt);
      assert.equal(res.status, 200);
    }
    const blocked = await handleMcpHttp(post("tools/list", {}), rt);
    assert.equal(blocked.status, 429);
    assert.equal(
      rt.audits.some((row) => row.error === "Rate limit exceeded."),
      true
    );
  });

  it("does not grant an admin session from the route", () => {
    const route = readFileSync("src/app/api/mcp/route.ts", "utf8");
    const http = readFileSync("src/lib/mcp/http.ts", "utf8");
    assert.doesNotMatch(`${route}\n${http}`, /next-auth|requireAdmin|require-admin/);
  });
});

describe("keygen hash", () => {
  it("matches the server hash", () => {
    const sample = "joy_example";
    assert.equal(
      hashMcpKey(sample),
      createHash("sha256").update(sample).digest("hex")
    );
  });
});
