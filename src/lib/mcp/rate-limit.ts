/** Authenticated MCP calls allowed per key per minute. */
export const MCP_RATE_LIMIT_PER_MINUTE = 60;
const WINDOW_MS = 60_000;

const hits = new Map<string, number[]>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

/**
 * Sliding window per bucket (a key name, or a hash of a rejected token).
 * `now` is injectable so tests do not depend on the clock.
 */
export function consumeRateLimit(
  bucket: string,
  now = Date.now(),
  limit = MCP_RATE_LIMIT_PER_MINUTE,
  windowMs = WINDOW_MS
): RateLimitResult {
  const recent = (hits.get(bucket) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000));
    hits.set(bucket, recent);
    return { ok: false, retryAfterSec };
  }
  recent.push(now);
  hits.set(bucket, recent);
  return { ok: true };
}

export function resetRateLimits(): void {
  hits.clear();
}
