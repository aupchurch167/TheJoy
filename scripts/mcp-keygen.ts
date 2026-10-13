import { createHash, randomBytes } from "node:crypto";

/**
 * Print a new MCP key and its SHA-256 hash.
 * Run on your own computer, not in Railway, so the raw key never hits deploy logs.
 *
 *   node --experimental-strip-types scripts/mcp-keygen.ts
 *
 * Put the hash in JOY_MCP_KEYS. Put the key only in the bot's MCP client.
 * The hash must match src/lib/mcp/auth.ts (SHA-256, hex).
 */
const key = `joy_${randomBytes(32).toString("base64url")}`;
const hash = createHash("sha256").update(key).digest("hex");

console.log("Store this key in the bot's MCP client. It will not be shown again.");
console.log(`key: ${key}`);
console.log("");
console.log("Store only this hash in JOY_MCP_KEYS:");
console.log(`hash: ${hash}`);
