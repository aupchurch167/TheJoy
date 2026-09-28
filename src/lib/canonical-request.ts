import redirectRules from "../../db/redirects.json";

/**
 * One canonical URL for every public request the app actually sees.
 *
 * Next.js `redirects()` run before this proxy and `permanent: true` is a 308,
 * so host, protocol, trailing slash, and legacy path rules have to be decided
 * together here. Otherwise `https://joyseniorcare.com/about/` is a 308 to drop
 * the slash and then a 301 to www. A single 301 sends the client to the final
 * https://www URL.
 *
 * HTTP → HTTPS for joyseniorcare.com is often answered by Railway's edge
 * before the request reaches Node (the edge keeps the host and the path).
 * When that happens this code never sees `x-forwarded-proto: http` and cannot
 * fold that hop in. If the request does arrive with `x-forwarded-proto: http`,
 * the upgrade is part of this same 301.
 */

const CANONICAL_HOST = "www.joyseniorcare.com";
const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;
const PRODUCTION_HOSTS = new Set(["joyseniorcare.com", CANONICAL_HOST]);

type RedirectRule = { from: string; to: string };

type WildcardRule = {
  prefix: string;
  to: string;
  /** Legacy Webflow indexes. The hashed `?e3b0b28b_page=` query is not a page. */
  stripQuery: boolean;
};

const exactRedirects = new Map<string, string>();
const wildcardRedirects: WildcardRule[] = [];
let thankYouRedirect: { pattern: RegExp; to: string } | null = null;

for (const rule of redirectRules as RedirectRule[]) {
  if (!rule?.from || !rule?.to || rule.from === rule.to) continue;
  if (rule.from.endsWith("/:path*")) {
    const prefix = rule.from.slice(0, -"/:path*".length);
    wildcardRedirects.push({
      prefix,
      to: rule.to,
      stripQuery: prefix === "/blog-category" || prefix === "/newsletters",
    });
    continue;
  }
  const thankYou = rule.from.match(/^\/:slug\((.+)\)$/);
  if (thankYou) {
    thankYouRedirect = { pattern: new RegExp(`^/${thankYou[1]}$`), to: rule.to };
    continue;
  }
  exactRedirects.set(rule.from, rule.to);
}

export type CanonicalInput = {
  method: string;
  /** Raw Host or X-Forwarded-Host value, possibly with a port. */
  hostHeader: string | null;
  /** X-Forwarded-Proto, if the platform set one. */
  forwardedProto: string | null;
  /** `nextUrl.protocol`, including the colon (`http:` / `https:`). */
  urlProtocol: string;
  pathname: string;
  /** Includes the leading `?`, or empty. */
  search: string;
};

export type CanonicalDecision =
  | { action: "next" }
  | { action: "gone" }
  | { action: "redirect"; location: string };

/** Prefer a public Joy host when one of the headers carries it. */
export function chooseHost(
  ...candidates: (string | null | undefined)[]
): string | null {
  for (const candidate of candidates) {
    if (PRODUCTION_HOSTS.has(hostnameOf(candidate ?? null))) return candidate ?? null;
  }
  for (const candidate of candidates) {
    if (candidate && candidate.trim()) return candidate;
  }
  return null;
}

function hostnameOf(hostHeader: string | null): string {
  const host = (hostHeader || "").split(",")[0].trim().toLowerCase();
  if (!host || host.startsWith("[")) return host;
  const colon = host.lastIndexOf(":");
  if (colon > -1 && /^\d+$/.test(host.slice(colon + 1))) {
    return host.slice(0, colon);
  }
  return host;
}

function protocolOf(input: CanonicalInput): string {
  const forwarded = (input.forwardedProto || "").split(",")[0].trim().toLowerCase();
  if (forwarded === "http" || forwarded === "https") return forwarded;
  const fromUrl = input.urlProtocol.replace(/:$/, "").toLowerCase();
  return fromUrl === "http" || fromUrl === "https" ? fromUrl : "https";
}

/** Lowercase, collapse repeated slashes, drop a trailing slash (root stays `/`). */
export function normalizePath(pathname: string): string {
  let path = pathname || "/";
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/{2,}/g, "/");
  path = path.toLowerCase();
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}

function legacyDestination(path: string): { path: string; stripQuery: boolean } | null {
  const exact = exactRedirects.get(path);
  if (exact) return { path: exact, stripQuery: false };

  for (const rule of wildcardRedirects) {
    if (path === rule.prefix || path.startsWith(`${rule.prefix}/`)) {
      return { path: rule.to, stripQuery: rule.stripQuery };
    }
  }

  if (thankYouRedirect && thankYouRedirect.pattern.test(path)) {
    return { path: thankYouRedirect.to, stripQuery: false };
  }

  return null;
}

/**
 * Decide whether this request is already canonical, should 301 once, or is
 * gone. GET and HEAD are the crawl methods. Other methods are left alone so a
 * server-action POST is not turned into a GET.
 */
export function decideCanonical(input: CanonicalInput): CanonicalDecision {
  const method = input.method.toUpperCase();
  const rawPath = input.pathname || "/";
  const path = normalizePath(rawPath);

  // Gone on every method. A trailing slash or the apex host is still this URL.
  if (path === "/401") return { action: "gone" };

  if (method !== "GET" && method !== "HEAD") return { action: "next" };

  const hostname = hostnameOf(input.hostHeader);
  const proto = protocolOf(input);
  const isProd = PRODUCTION_HOSTS.has(hostname);

  let search = input.search || "";
  if (search === "?") search = "";

  const legacy = legacyDestination(path);
  const finalPath = legacy?.path ?? path;
  if (legacy?.stripQuery) search = "";

  const pathChanged = finalPath !== rawPath;
  const searchChanged = search !== (input.search === "?" ? "" : input.search || "");
  const hostChanged = isProd && (hostname !== CANONICAL_HOST || proto !== "https");

  if (!pathChanged && !searchChanged && !hostChanged) return { action: "next" };

  const host = (input.hostHeader || "").split(",")[0].trim();
  const origin = isProd ? CANONICAL_ORIGIN : `${proto}://${host || "localhost"}`;
  const location = `${origin}${finalPath}${search}`;
  return { action: "redirect", location };
}
