/**
 * Admin access control (§1a). This is the SECURITY BOUNDARY. It runs on the
 * server (in the OAuth callback and route guards). Never trust the Google `hd`
 * hint or anything the client sends.
 *
 * Rule:
 *   - The Google email must be verified (email_verified === true), AND
 *   - the email domain must be joyseniorcare.com, AND
 *   - if ADMIN_ALLOWLIST is set, the email must also be in it.
 *   - If ADMIN_ALLOWLIST is empty, domain match alone is enough (default).
 */

export const ALLOWED_DOMAIN = "joyseniorcare.com";

/** Optional tighter control. Comma-separated emails in the ADMIN_ALLOWLIST env. */
export function adminAllowlist(): string[] {
  return (process.env.ADMIN_ALLOWLIST || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdmin(
  email: string | null | undefined,
  emailVerified: boolean | null | undefined
): boolean {
  if (!email) return false;
  // Reject unverified emails. Treat unknown (undefined) as NOT verified.
  if (emailVerified !== true) return false;

  const e = email.toLowerCase();
  const domainOk = e.endsWith(`@${ALLOWED_DOMAIN}`);
  if (!domainOk) return false;

  const allowlist = adminAllowlist();
  if (allowlist.length > 0) return allowlist.includes(e);

  return true;
}
