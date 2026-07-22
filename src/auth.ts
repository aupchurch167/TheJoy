import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { timingSafeEqual } from "node:crypto";
import { ALLOWED_DOMAIN, isAllowedAdmin } from "@/lib/access";

/**
 * Auth.js (NextAuth v5). Production sign-in is Google, domain-restricted to
 * @joyseniorcare.com (§1a), enforced server-side in the `signIn` callback.
 *
 * TEMPORARY PASSWORD LOGIN (bridge until Google OAuth is deployed):
 * If ADMIN_PASSWORD is set, a shared-password login is also offered. It only
 * exists while that env var is set; unset it to return to Google-only. The
 * password is compared in constant time and never leaves the server. A
 * password login is issued a valid admin identity so every existing /admin
 * guard applies unchanged.
 *
 * Env vars (set in Railway):
 *   AUTH_SECRET         random string (generate: `openssl rand -base64 32`)
 *   AUTH_GOOGLE_ID      Google OAuth client ID
 *   AUTH_GOOGLE_SECRET  Google OAuth client secret
 *   ADMIN_ALLOWLIST     (optional) comma-separated emails for tighter control
 *   ADMIN_PASSWORD      (optional, TEMPORARY) enables shared-password login
 *   ADMIN_EMAIL         (optional) identity used for password logins
 *                       (defaults to admin@joyseniorcare.com)
 */

export function passwordLoginEnabled(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  // Constant-time compare; length mismatch is an early, safe reject.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function adminIdentityEmail(): string {
  return (process.env.ADMIN_EMAIL || `admin@${ALLOWED_DOMAIN}`).toLowerCase();
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Google({
      // Ask Google for a fresh account chooser each time.
      authorization: { params: { prompt: "select_account" } },
    }),
    Credentials({
      id: "password",
      name: "Admin password",
      credentials: { password: { label: "Password", type: "password" } },
      authorize(credentials) {
        const pw =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!passwordMatches(pw)) return null;
        // A valid admin identity so the existing domain checks pass.
        return {
          id: "admin",
          name: "Joy Admin",
          email: adminIdentityEmail(),
        };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    /**
     * The gate. For Google, independently verify email_verified AND domain
     * (never the `hd` hint). For the password provider, authorize() already
     * validated the shared secret.
     */
    async signIn({ account, profile }) {
      if (account?.provider === "password") return true;
      const email = profile?.email;
      const verified = (profile as { email_verified?: boolean } | undefined)
        ?.email_verified;
      return isAllowedAdmin(email, verified);
    },
    async jwt({ token, user }) {
      // `user` is present on initial sign-in for both providers.
      if (user?.email) token.email = user.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
      }
      return session;
    },
    /**
     * Used by middleware/proxy to protect /admin. Re-asserts the admin identity
     * on every request. The password provider issues an @joyseniorcare.com
     * identity, so this check covers both sign-in methods.
     */
    authorized({ auth, request }) {
      const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
      if (!isAdminRoute) return true;
      if (request.nextUrl.pathname.startsWith("/admin/login")) return true;
      return isAllowedAdmin(auth?.user?.email, true);
    },
  },
});
