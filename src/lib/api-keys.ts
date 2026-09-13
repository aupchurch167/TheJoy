/**
 * Scoped API keys for external integrations (e.g. GrokBot pushing reviews).
 * Configured via the INTEGRATION_API_KEYS env var, one key per line:
 *   label | key
 * e.g.
 *   grokbot | k_9f2c... (a long random string you generate)
 *
 * A key authenticates ONLY the integration endpoints it is checked in (today,
 * the reviews ingest). It never grants admin/session access. Revoke a key by
 * removing its line and redeploying. Compares in constant time (Web Crypto, so
 * this stays edge-safe if ever imported into the middleware bundle).
 */

type ApiKey = { label: string; key: string };

function parseKeys(): ApiKey[] {
  const raw = process.env.INTEGRATION_API_KEYS || "";
  if (!raw.trim()) return [];
  return raw
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, key] = line.split("|").map((s) => s.trim());
      if (!label || !key) return null;
      return { label, key };
    })
    .filter((x): x is ApiKey => x !== null);
}

export function integrationKeysConfigured(): boolean {
  return parseKeys().length > 0;
}

async function safeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

/** Read the presented key from Authorization: Bearer, or the X-API-Key header. */
function presentedKey(req: Request): string {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (m) return m[1].trim();
  return (req.headers.get("x-api-key") || "").trim();
}

/**
 * Verify the request's API key. Returns the matching key's LABEL (for audit,
 * stored as submitted_by) or null. Runs a comparison for every configured key
 * so timing does not reveal which labels exist.
 */
export async function verifyApiKey(req: Request): Promise<string | null> {
  const presented = presentedKey(req);
  if (!presented) return null;
  let label: string | null = null;
  for (const k of parseKeys()) {
    if (await safeEqual(k.key, presented)) label = k.label;
  }
  return label;
}
