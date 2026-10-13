import { query } from "../db";

/**
 * Create-tool dedupe. `fresh` means this caller owns the key and must finish
 * or abort. `pending` means another call with the same key is still running.
 * A replay returns the first call's result and does not create again.
 */
export type IdempotencyBegin = "fresh" | "pending" | { replay: unknown };

export interface IdempotencyStore {
  begin(keyName: string, tool: string, idemKey: string): Promise<IdempotencyBegin>;
  finish(keyName: string, tool: string, idemKey: string, result: unknown): Promise<void>;
  abort(keyName: string, tool: string, idemKey: string): Promise<void>;
}

type Row = { result: unknown | undefined };

export function createMemoryIdempotency(): IdempotencyStore {
  const rows = new Map<string, Row>();
  const id = (keyName: string, tool: string, idemKey: string) =>
    `${keyName}\0${tool}\0${idemKey}`;
  return {
    async begin(keyName, tool, idemKey) {
      const key = id(keyName, tool, idemKey);
      const existing = rows.get(key);
      if (!existing) {
        rows.set(key, { result: undefined });
        return "fresh";
      }
      if (existing.result === undefined) return "pending";
      return { replay: existing.result };
    },
    async finish(keyName, tool, idemKey, result) {
      rows.set(id(keyName, tool, idemKey), { result });
    },
    async abort(keyName, tool, idemKey) {
      const key = id(keyName, tool, idemKey);
      const existing = rows.get(key);
      if (existing && existing.result === undefined) rows.delete(key);
    },
  };
}

export const pgIdempotency: IdempotencyStore = {
  async begin(keyName, tool, idemKey) {
    const inserted = await query<{ key_name: string }>(
      `INSERT INTO mcp_idempotency (key_name, tool, idempotency_key)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING
       RETURNING key_name`,
      [keyName, tool, idemKey]
    );
    if (inserted.length > 0) return "fresh";
    const rows = await query<{ result: unknown }>(
      `SELECT result FROM mcp_idempotency
        WHERE key_name = $1 AND tool = $2 AND idempotency_key = $3`,
      [keyName, tool, idemKey]
    );
    const result = rows[0]?.result;
    if (result == null) return "pending";
    return { replay: result };
  },
  async finish(keyName, tool, idemKey, result) {
    await query(
      `UPDATE mcp_idempotency SET result = $4::jsonb
        WHERE key_name = $1 AND tool = $2 AND idempotency_key = $3`,
      [keyName, tool, idemKey, JSON.stringify(result)]
    );
  },
  async abort(keyName, tool, idemKey) {
    await query(
      `DELETE FROM mcp_idempotency
        WHERE key_name = $1 AND tool = $2 AND idempotency_key = $3
          AND result IS NULL`,
      [keyName, tool, idemKey]
    );
  },
};
