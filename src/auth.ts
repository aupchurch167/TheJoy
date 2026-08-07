import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAllowedAdmin } from "@/lib/access";

/**
 * Auth.js (NextAuth v5). Admin sign-in is GOOGLE ONLY, restricted to verified
 * @joyseniorcare.com accounts (§1a), enforced server-side in the `signIn`
 * callback (never trust the Google `hd` hint). There is no password login.
 *
 * Env vars (set in Railway):
 *   AUTH_SECRET         random string (generate: `openssl rand -base64 32`)
 *   AUTH_URL            the live site URL (so redirects use the real domain)
 *   AUTH_GOOGLE_ID      Google OAuth client ID
 *   AUTH_GOOGLE_SECRET  Google OAuth client secret
 *   ADMIN_ALLOWLIST     (optional) comma-separated emails for tighter control
 *
 * The Google OAuth client's Authorized redirect URI must be
 *   https://www.joyseniorcare.com/api/auth/callback/google
 */

export function googleLoginEnabled(): boolean {
  return !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

// Register Google only when its credentials are present: a half-configured
// OAuth provider makes Auth.js throw a "server configuration" error on every
// auth request. The login page checks googleLoginEnabled() before offering it.
const providers = [];
if (googleLoginEnabled()) {
  providers.push(
    Google({
      // Ask Google for a fresh account chooser each time.
      authorization: { params: { prompt: "select_account" } },
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
    async signIn({ profile }) {
      const email = profile?.email;
      const verified = (profile as { email_verified?: boolean } | undefined)
        ?.email_verified;
      return isAllowedAdmin(email, verified);
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
