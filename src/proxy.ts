import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAllowedAdmin } from "@/lib/access";

// Next.js 16 renamed the "middleware" convention to "proxy". This wraps the
// Auth.js handler so we can do two things in one pass:
//
//   1. Canonicalize URL casing. Every route on the site is lowercase, but print
//      materials and email clients routinely produce cased links (e.g. /About).
//      Those would 404, so a cased path 308s to its lowercase form (SEO #10).
//   2. Protect /admin exactly as before (only allowed admins get in; the login
//      page is always reachable), using the Auth.js session on the request.
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 1. Lowercase redirect (skip API routes; they are matched out below anyway).
  if (/[A-Z]/.test(pathname) && !pathname.startsWith("/api/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url, 308);
  }

  // 2. Admin gate. The login page is always allowed through so a signed-out
  //    admin can reach it; everything else under /admin requires an allowed
  //    identity (Google domain-restricted, or the temporary password login).
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!isAllowedAdmin(req.auth?.user?.email, true)) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  // Run on all page routes so the casing redirect applies site-wide, but skip
  // Next internals, the auth API, and files with an extension (static assets).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
