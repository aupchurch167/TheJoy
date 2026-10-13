import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  authenticateBearer,
  hashMcpKey,
  hashesEqual,
  parseMcpKeys,
} from "../src/lib/mcp/auth";
import { hasScope } from "../src/lib/mcp/scopes";

const RAW = "test-key-one";
const HASH = hashMcpKey(RAW);

function keysJson(scopes: string[]) {
  return JSON.stringify([{ name: "joy-coo", hash: HASH, scopes }]);
}

describe("MCP keys", () => {
  it("returns 503 when JOY_MCP_KEYS is unset", () => {
    const result = parseMcpKeys(undefined);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, 503);
  });

  it("returns 503 for invalid JSON", () => {
    const result = parseMcpKeys("{");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 503);
      assert.match(result.error, /not valid JSON/);
    }
  });

  it("accepts a matching bearer and rejects a wrong one", () => {
    const parsed = parseMcpKeys(keysJson(["emails", "read"]));
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    const ok = authenticateBearer(`Bearer ${RAW}`, parsed.keys);
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.principal.kind, "mcp");
      assert.equal(ok.principal.name, "joy-coo");
      assert.equal("email" in ok.principal, false);
      assert.deepEqual(ok.principal.scopes, ["emails", "read"]);
    }
    const bad = authenticateBearer("Bearer not-the-key", parsed.keys);
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.equal(bad.error, "Unauthorized.");
    assert.equal(bad.ok === false && bad.error.includes(RAW), false);
  });

  it("compares hashes in constant time and ignores length mismatches", () => {
    assert.equal(hashesEqual(HASH, HASH), true);
    assert.equal(hashesEqual(HASH, hashMcpKey("other")), false);
    assert.equal(hashesEqual("abc", HASH), false);
    assert.equal(hashesEqual(HASH.toUpperCase(), HASH), false);
  });

  it("treats * as every scope and does not let emails grant texts", () => {
    assert.equal(hasScope(["*"], "texts"), true);
    assert.equal(hasScope(["*"], "emails"), true);
    assert.equal(hasScope(["emails", "read"], "emails"), true);
    assert.equal(hasScope(["emails", "read"], "texts"), false);
    assert.equal(hasScope(["read"], "families"), false);
  });

  it("collapses a star key to * and drops unknown scopes", () => {
    const parsed = parseMcpKeys(
      JSON.stringify([
        { name: "marketing", hash: HASH, scopes: ["emails", "nope", "texts", "*"] },
      ])
    );
    assert.equal(parsed.ok, true);
    if (parsed.ok) assert.deepEqual(parsed.keys[0].scopes, ["*"]);
  });
});
