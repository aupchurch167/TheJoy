import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { isAllowedAdmin } from "@/lib/access";
import { findAdminAccount, passwordLoginEnabled } from "@/lib/admin-credentials";

/**
 * Auth.js (NextAuth v5). Admin sign-in accepts two methods, both restricted to
 * verified @joyseniorcare.com admins (§1a), enforced server-side:
 *   1. Google OAuth (never trust the Google `hd` hint), and
 *   2. Username + password (Credentials), configured via ADMIN_LOGIN_USERS.
 * Password accounts still resolve to an @joyseniorcare.com email that must pass
 * isAllowedAdmin(), so password login never grants access OAuth would not.
 *
 * Env vars (set in Railway):
 *   AUTH_SECRET         random string (generate: `openssl rand -base64 32`)
 *   AUTH_URL            the live site URL (so redirects use the real domain)
 *   AUTH_GOOGLE_ID      Google OAuth client ID       (optional; enables Google)
 *   AUTH_GOOGLE_SECRET  Google OAuth client secret   (optional; enables Google)
 *   ADMIN_LOGIN_USERS   username|password|email lines (optional; enables login)
 *   ADMIN_ALLOWLIST     (optional) comma-separated emails for tighter control
 *
 * The Google OAuth client's Authorized redirect URI must be
 *   https://www.joyseniorcare.com/api/auth/callback/google
 */

export function googleLoginEnabled(): boolean {
  return !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

// Re-exported so the login page can decide whether to show the password form.
export { passwordLoginEnabled };

// Register each provider only when configured: a half-configured OAuth provider
// makes Auth.js throw a "server configuration" error on every auth request.
const providers = [];
if (googleLoginEnabled()) {
  providers.push(
    Google({
      // Ask Google for a fresh account chooser each time.
      authorization: { params: { prompt: "select_account" } },
    })
  );
}
if (passwordLoginEnabled()) {
  providers.push(
    Credentials({
      name: "Password",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // Returns a user only for a valid username+password whose email is an
      // allowed admin. Returning null makes Auth.js reject the sign-in.
      authorize: async (creds) => {
        const account = await findAdminAccount(
          typeof creds?.username === "string" ? creds.username : "",
          typeof creds?.password === "string" ? creds.password : ""
        );
        if (!account) return null;
        if (!isAllowedAdmin(account.email, true)) return null;
        return { id: account.email, email: account.email, name: account.username };
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers,
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    /**
     * The gate. Independently verify email_verified AND the joyseniorcare.com
     * domain (never the Google `hd` hint), plus the optional ADMIN_ALLOWLIST.
     */
    async signIn({ profile, user, account }) {
      // Password sign-in: authorize() already validated the credentials and the
      // account's email. Re-assert the admin gate here as defense in depth.
      if (account?.provider === "credentials") {
        return isAllowedAdmin(user?.email, true);
      }
      const email = profile?.email;
      // Google sends email_verified as a boolean, but coerce a string "true"
      // just in case, so a real verified account is never wrongly rejected.
      const raw = (profile as { email_verified?: boolean | string } | undefined)
        ?.email_verified;
      const verified = raw === true || raw === "true";
      const ok = isAllowedAdmin(email, verified);
      if (!ok) {
        // Shows in the server logs (e.g. Railway) so a rejected sign-in can be
        // diagnosed: which email, whether Google marked it verified, and whether
        // an ADMIN_ALLOWLIST is narrowing access.
        console.warn("[auth] sign-in rejected", {
          email: email || "(none)",
          email_verified: raw,
          domainOk: !!email && email.toLowerCase().endsWith("@joyseniorcare.com"),
          allowlist: process.env.ADMIN_ALLOWLIST || "(empty)",
        });
      }
      return ok;
    },
    async jwt({ token, user }) {
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
     * Protects /admin (used by the proxy/middleware): re-asserts an allowed
     * @joyseniorcare.com identity on every admin request.
     */
    authorized({ auth, request }) {
      const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
      if (!isAdminRoute) return true;
      if (request.nextUrl.pathname.startsWith("/admin/login")) return true;
      return isAllowedAdmin(auth?.user?.email, true);
    },
  },
});
