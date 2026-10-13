import type { ZodType } from "zod";
import { auditErrorMessage, type NewAudit } from "./audit";
import { McpToolError } from "./errors";
import type { IdempotencyStore } from "./idempotency";
import type { McpPrincipal } from "./auth";
import { hasScope, type ToolScope } from "./scopes";

export type ToolSuccess = { data: unknown; ref?: string | null };

export type ToolOutcome =
  | { ok: true; data: unknown; ref: string | null }
  | { ok: false; message: string };

export type McpTool = {
  name: string;
  description: string;
  scope: ToolScope;
  schema: ZodType;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
  /** Create tools pass idempotency_key through to the store. */
  idempotent?: boolean;
  handler: (args: unknown, principal: McpPrincipal) => Promise<ToolSuccess>;
};

export type ExecuteDeps = {
  audit: (row: NewAudit) => Promise<void>;
  idempotency: IdempotencyStore;
};

function idempotencyKey(args: unknown): string {
  if (!args || typeof args !== "object" || !("idempotency_key" in args)) return "";
  const value = (args as { idempotency_key?: unknown }).idempotency_key;
  return typeof value === "string" ? value.trim() : "";
}

async function record(
  deps: ExecuteDeps,
  row: NewAudit
): Promise<void> {
  await deps.audit(row);
}

/**
 * Scope check, validation, optional idempotency, then the handler. Every
 * path writes an audit row, including scope denials and failures.
 */
export async function executeTool(
  tool: McpTool,
  rawArgs: unknown,
  principal: McpPrincipal,
  deps: ExecuteDeps
): Promise<ToolOutcome> {
  const args = rawArgs ?? {};
  if (!hasScope(principal.scopes, tool.scope)) {
    const message = `Missing scope: ${tool.scope}.`;
    await record(deps, {
      keyName: principal.name,
      tool: tool.name,
      args,
      ok: false,
      error: message,
      resultRef: null,
    });
    return { ok: false, message };
  }

  const parsed = tool.schema.safeParse(args);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input.";
    await record(deps, {
      keyName: principal.name,
      tool: tool.name,
      args,
      ok: false,
      error: message,
      resultRef: null,
    });
    return { ok: false, message };
  }

  const key = tool.idempotent ? idempotencyKey(parsed.data) : "";
  if (key) {
    const begun = await deps.idempotency.begin(principal.name, tool.name, key);
    if (begun === "pending") {
      const message = "A request with this idempotency_key is still running.";
      await record(deps, {
        keyName: principal.name,
        tool: tool.name,
        args: parsed.data,
        ok: false,
        error: message,
        resultRef: null,
      });
      return { ok: false, message };
    }
    if (typeof begun === "object" && begun && "replay" in begun) {
      const replay = begun.replay as ToolSuccess;
      await record(deps, {
        keyName: principal.name,
        tool: tool.name,
        args: parsed.data,
        ok: true,
        error: null,
        resultRef: replay.ref ?? null,
      });
      return { ok: true, data: replay.data, ref: replay.ref ?? null };
    }
  }

  try {
    const result = await tool.handler(parsed.data, principal);
    if (key) {
      await deps.idempotency.finish(principal.name, tool.name, key, result);
    }
    await record(deps, {
      keyName: principal.name,
      tool: tool.name,
      args: parsed.data,
      ok: true,
      error: null,
      resultRef: result.ref ?? null,
    });
    return { ok: true, data: result.data, ref: result.ref ?? null };
  } catch (err) {
    if (key) await deps.idempotency.abort(principal.name, tool.name, key);
    const message =
      err instanceof McpToolError ? err.message : auditErrorMessage(err);
    if (!(err instanceof McpToolError)) console.error("[mcp]", tool.name, err);
    await record(deps, {
      keyName: principal.name,
      tool: tool.name,
      args: parsed.data,
      ok: false,
      error: message,
      resultRef: null,
    });
    return { ok: false, message };
  }
}
