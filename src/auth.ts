import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAllowedAdmin } from "@/lib/access";

/**
 * Auth.js (NextAuth v5) with Google sign-in only. All access decisions happen
 * server-side in the `signIn` callback (see lib/access.ts), which is the
 * security boundary required by §1a.
 *
 * Env vars (set in Railway):
 *   AUTH_SECRET         random string (generate: `openssl rand -base64 32`)
 *   AUTH_GOOGLE_ID      Google OAuth client ID
 *   AUTH_GOOGLE_SECRET  Google OAuth client secret
 *   ADMIN_ALLOWLIST     (optional) comma-separated emails for tighter control
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      // Ask Google for a fresh account chooser each time.
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    /**
     * The gate. Runs on the server after Google returns the profile.
     * Independently verifies email_verified AND domain (never the `hd` hint).
     */
    async signIn({ profile }) {
      const email = profile?.email;
      // Google sets email_verified on the profile; treat missing as false.
      const verified = (profile as { email_verified?: boolean } | undefined)
        ?.email_verified;
      return isAllowedAdmin(email, verified);
    },
    async jwt({ token, profile }) {
      if (profile?.email) token.email = profile.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
      }
      return session;
    },
    /**
     * Used by middleware to protect /admin. Re-checks the email on every
     * request rather than trusting a stale session shape.
     */
    authorized({ auth, request }) {
      const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
      if (!isAdminRoute) return true;
      // The login page under /admin must stay public.
      if (request.nextUrl.pathname.startsWith("/admin/login")) return true;
      const email = auth?.user?.email;
      // Session emails only exist if signIn already passed the domain gate,
      // but re-assert domain/allowlist here as defense in depth.
      return isAllowedAdmin(email, true);
    },
  },
});
