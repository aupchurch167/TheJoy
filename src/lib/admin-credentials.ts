/**
 * Username + password admin accounts, read from the ADMIN_LOGIN_USERS env var.
 * This is a SECURITY-SENSITIVE module used by the Auth.js Credentials provider.
 *
 * It must stay EDGE-SAFE: `src/proxy.ts` (the middleware) imports `@/auth`,
 * which imports this file, so no `node:*` imports are allowed here. Password
 * comparison therefore uses Web Crypto (available in both edge and Node).
 *
 * Format (ADMIN_LOGIN_USERS): one account per line (or comma-separated), each
 *   username | password | email(optional)
 * e.g.
 *   adam | a-strong-passphrase | adam@joyseniorcare.com
 *   mellissa | another-strong-passphrase
 * If the email is omitted it defaults to <username>@joyseniorcare.com. The
 * resulting email must still pass isAllowedAdmin() (verified @joyseniorcare.com,
 * and in ADMIN_ALLOWLIST when that is set), so password login can never grant
 * access an OAuth sign-in would not. Passwords are compared in constant time.
 *
 * Notes for the operator:
 *   - Env vars are this app's secret store (same place as AUTH_SECRET and API
 *     keys). Choose a long, unique passphrase for each account.
 *   - Separate accounts with new lines (preferred) or commas. Do not use the
 *     "|" character inside a password, and avoid commas if you comma-separate.
 */

type RawAccount = { username: string; password: string; email: string };
export type AdminAccount = { username: string; email: string };

function parseUsers(): RawAccount[] {
  const raw = process.env.ADMIN_LOGIN_USERS || "";
  if (!raw.trim()) return [];
  return raw
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [username, password, email] = line.split("|").map((s) => s.trim());
      if (!username || !password) return null;
      const resolvedEmail = (
        email || `${username.toLowerCase()}@joyseniorcare.com`
      ).toLowerCase();
      return { username, password, email: resolvedEmail };
    })
    .filter((x): x is RawAccount => x !== null);
}

/** True when at least one username/password account is configured. */
export function passwordLoginEnabled(): boolean {
  return parseUsers().length > 0;
}

/** Constant-time compare of two strings (hash to fixed length via Web Crypto). */
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

/**
 * Return the matching account for a username + password, or null. Always runs a
 * comparison for every configured account (even after a match) so the timing
 * does not reveal which usernames exist.
 */
export async function findAdminAccount(
  username: string,
  password: string
): Promise<AdminAccount | null> {
  const u = (username || "").trim().toLowerCase();
  const pw = password || "";
  if (!u || !pw) return null;

  let match: AdminAccount | null = null;
  for (const acct of parseUsers()) {
    const pwMatch = await safeEqual(acct.password, pw);
    if (acct.username.toLowerCase() === u && pwMatch) {
      match = { username: acct.username, email: acct.email };
    }
  }
  return match;
}
