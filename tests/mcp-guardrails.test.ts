import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { DUE_BROADCAST_WHERE } from "../src/lib/broadcasts";
import { createMemoryIdempotency } from "../src/lib/mcp/idempotency";
import { executeTool, type McpTool } from "../src/lib/mcp/execute";
import { assertToolNameAllowed, assertToolsAreDraftOnly } from "../src/lib/mcp/guard";
import { MCP_EMAIL_AUDIENCES } from "../src/lib/mcp/email-draft";
import { allTools } from "../src/lib/mcp/tools/index";
import { consumeRateLimit, resetRateLimits } from "../src/lib/mcp/rate-limit";
import { truncateAuditValue, writeAudit } from "../src/lib/mcp/audit";
import type { McpPrincipal } from "../src/lib/mcp/auth";
import { z } from "zod";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (path.endsWith("")) out.push(path);
  }
  return out;
}

const principal = (scopes: McpPrincipal["scopes"]): McpPrincipal => ({
  kind: "mcp",
  name: "marketing",
  scopes,
});

describe("draft-only registry", () => {
  it("rejects tool names that send, schedule, or test-send", () => {
    assert.throws(() => assertToolNameAllowed("emails_send"));
    assert.throws(() => assertToolNameAllowed("texts_schedule"));
    assert.throws(() => assertToolNameAllowed("texts_test_send"));
    assert.doesNotThrow(() => assertToolNameAllowed("emails_preview_recipients"));
    assert.doesNotThrow(() => assertToolNameAllowed("texts_create_draft"));
  });

  it("registers only draft tools and no send path in the MCP source", () => {
    const tools = allTools();
    assertToolsAreDraftOnly(tools);
    const names = tools.map((tool) => tool.name).sort();
    assert.deepEqual(names, [
      "emails_create_draft",
      "emails_get",
      "emails_list_drafts",
      "emails_preview_recipients",
      "emails_update_draft",
      "texts_create_draft",
      "texts_list_drafts",
      "texts_preview_recipients",
      "texts_update_draft",
    ]);
    const src = walk("src/lib/mcp")
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    assert.doesNotMatch(
      src,
      /scheduleBroadcast|sendMarketingEmail|sendSms|sendOrSchedule|sendTextBlast|sendTestEmail|sendTestToAdmins/
    );
  });

  it("keeps the broadcast runner on scheduled email only", () => {
    assert.match(DUE_BROADCAST_WHERE, /status = 'scheduled'/);
    assert.match(DUE_BROADCAST_WHERE, /channel = 'email'/);
    assert.match(DUE_BROADCAST_WHERE, /scheduled_at <= now\(\)/);
    assert.doesNotMatch(DUE_BROADCAST_WHERE, /draft/);
    const broadcasts = readFileSync("src/lib/broadcasts.ts", "utf8");
    const insert = broadcasts.slice(
      broadcasts.indexOf("INSERT INTO broadcasts"),
      broadcasts.indexOf("RETURNING *")
    );
    assert.doesNotMatch(insert, /scheduled_at/);
    assert.doesNotMatch(insert, /\bstatus\b/);
  });

  it("only drafts audiences the broadcasts table allows, never leads", () => {
    const schema = readFileSync("db/schema.sql", "utf8");
    const matches = [
      ...schema.matchAll(/broadcasts_audience_check CHECK \(audience IN \(([^)]+)\)\)/g),
    ];
    const last = matches.at(-1)?.[1] ?? "";
    for (const audience of MCP_EMAIL_AUDIENCES) {
      assert.match(last, new RegExp(`'${audience}'`));
    }
    assert.equal(MCP_EMAIL_AUDIENCES.includes("leads" as "families"), false);
    assert.equal(last.includes("'partners'"), false);
  });
});

describe("audit and scope denial", () => {
  it("truncates long bodies before they are stored", async () => {
    const body = "a".repeat(800);
    const stored: unknown[] = [];
    await writeAudit(
      {
        keyName: "marketing",
        tool: "emails_create_draft",
        args: { body, subject: "Hello" },
        ok: true,
        error: null,
        resultRef: "abc",
      },
      async (_sql, params) => {
        stored.push(params?.[2]);
      }
    );
    const args = JSON.parse(String(stored[0]));
    assert.equal(args.subject, "Hello");
    assert.match(args.body, /truncated/);
    assert.ok(args.body.length < body.length);
  });

  it("logs a scope denial and does not run the handler", async () => {
    let ran = false;
    const audits: { ok: boolean; error: string | null; tool: string }[] = [];
    const tool: McpTool = {
      name: "emails_list_drafts",
      description: "list",
      scope: "emails",
      schema: z.object({}).strict(),
      handler: async () => {
        ran = true;
        return { data: {} };
      },
    };
    const outcome = await executeTool(tool, {}, principal(["read"]), {
      audit: async (row) => {
        audits.push({ ok: row.ok, error: row.error, tool: row.tool });
      },
      idempotency: createMemoryIdempotency(),
    });
    assert.equal(ran, false);
    assert.equal(outcome.ok, false);
    if (!outcome.ok) assert.match(outcome.message, /Missing scope: emails/);
    assert.equal(audits.length, 1);
    assert.equal(audits[0].ok, false);
    assert.match(audits[0].error ?? "", /emails/);
  });

  it("dedupes create retries with an idempotency key", async () => {
    let calls = 0;
    const tool: McpTool = {
      name: "emails_create_draft",
      description: "create",
      scope: "emails",
      schema: z.object({ idempotency_key: z.string().optional() }).strict(),
      idempotent: true,
      handler: async () => {
        calls += 1;
        return { data: { id: "draft-1", status: "draft" }, ref: "draft-1" };
      },
    };
    const deps = {
      audit: async () => {},
      idempotency: createMemoryIdempotency(),
    };
    const first = await executeTool(
      tool,
      { idempotency_key: "retry-1" },
      principal(["emails"]),
      deps
    );
    const second = await executeTool(
      tool,
      { idempotency_key: "retry-1" },
      principal(["emails"]),
      deps
    );
    assert.equal(calls, 1);
    assert.equal(first.ok && second.ok, true);
    if (first.ok && second.ok) assert.deepEqual(second.data, first.data);
  });
});

describe("rate limit", () => {
  it("allows 60 calls in a minute and rejects the 61st", () => {
    resetRateLimits();
    const now = 1_700_000_000_000;
    for (let i = 0; i < 60; i++) {
      assert.equal(consumeRateLimit("joy-coo", now).ok, true);
    }
    const blocked = consumeRateLimit("joy-coo", now);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.ok(blocked.retryAfterSec >= 1);
    assert.equal(consumeRateLimit("marketing", now).ok, true);
    resetRateLimits();
  });
});

describe("truncate helper", () => {
  it("leaves short strings alone", () => {
    assert.equal(truncateAuditValue("hello"), "hello");
  });
});
