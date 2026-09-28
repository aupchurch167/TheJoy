import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAllowedAdmin } from "@/lib/access";
import { chooseHost, decideCanonical } from "@/lib/canonical-request";

// Next.js 16 renamed the "middleware" convention to "proxy". This wraps the
// Auth.js handler so we can do two things in one pass:
//
//   1. One 301 to the final URL: https, www, no trailing slash, lowercase, and
//      any legacy path in db/redirects.json. Doing this here (instead of in
//      next.config redirects, which run first and emit 308) keeps a single hop.
//      /401 is 410 Gone and is not redirected.
//   2. Protect /admin exactly as before (only allowed admins get in; the login
//      page is always reachable), using the Auth.js session on the request.
export default auth((req) => {
  const { pathname } = req.nextUrl;

  const decision = decideCanonical({
    method: req.method,
    hostHeader: chooseHost(
      req.headers.get("x-forwarded-host"),
      req.headers.get("host"),
      req.nextUrl.host
    ),
    forwardedProto: req.headers.get("x-forwarded-proto"),
    urlProtocol: req.nextUrl.protocol,
    pathname,
    search: req.nextUrl.search,
  });

  if (decision.action === "gone") {
    return new NextResponse("Gone", {
      status: 410,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (decision.action === "redirect") {
    return NextResponse.redirect(decision.location, 301);
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
