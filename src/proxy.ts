// Protects /admin using the Auth.js `authorized` callback (see src/auth.ts).
// Unauthenticated or non-admin users hitting /admin are redirected to login.
//
// Next.js 16 renamed the "middleware" convention to "proxy"; the Auth.js
// handler works unchanged under the new name.
export { auth as proxy } from "@/auth";

export const config = {
  // Run on all /admin routes (the login page is allowed through in auth.ts).
  matcher: ["/admin/:path*"],
};
