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
  const host = req.headers.get("host") || req.nextUrl.host;

  // 0. Canonical host: the bare apex (joyseniorcare.com) 301s to www, which is
  //    the canonical host everywhere else (SITE_URL, AUTH_URL, OG, sitemap).
  //    Only the exact apex is matched, so localhost, the *.up.railway.app URL,
  //    and platform health checks are left alone. (Requires the apex to have a
  //    TLS cert on the host, i.e. added as a custom domain in Railway.)
  if (host === "joyseniorcare.com") {
    const url = req.nextUrl.clone();
    url.hostname = "www.joyseniorcare.com";
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

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
