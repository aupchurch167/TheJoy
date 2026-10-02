import type { NextConfig } from "next";

/**
 * Legacy Webflow paths live in db/redirects.json and are applied in
 * src/proxy.ts (see src/lib/canonical-request.ts), not here.
 *
 * next.config redirects run before the proxy, and `permanent: true` is a 308.
 * Keeping them here would 308 the path and then 301 the host. The proxy issues
 * one 301 that includes host, protocol, trailing slash, and the legacy path.
 * `skipTrailingSlashRedirect` stops Next from 308-ing a trailing slash before
 * that proxy decision.
 */

/**
 * Keep pre-launch / staging hosts out of Google. Two triggers, both belt and
 * suspenders so the live www domain is never accidentally deindexed:
 *
 *  1. Any *.railway.app host (the default Railway domain) gets X-Robots-Tag:
 *     noindex automatically, and stops the moment traffic is on the real
 *     domain. Nothing to remember to remove.
 *  2. SEO_NOINDEX=true noindexes every host (a manual kill switch for any
 *     other preview URL). Leave it unset in production.
 *
 * The canonical www domain matches neither, so it stays fully indexable.
 */
type HeaderRules = Awaited<ReturnType<NonNullable<NextConfig["headers"]>>>;

function loadNoindexHeaders(): HeaderRules {
  const header = { key: "X-Robots-Tag", value: "noindex, nofollow" };
  const rules: HeaderRules = [
    {
      // Default Railway domain, e.g. joy-production.up.railway.app.
      source: "/:path*",
      has: [{ type: "host", value: ".*\\.railway\\.app" }],
      headers: [header],
    },
  ];
  if (process.env.SEO_NOINDEX === "true") {
    rules.push({ source: "/:path*", headers: [header] });
  }
  return rules;
}

/**
 * next/image remote hosts. Must be a SUPERSET of the allowlist in
 * src/lib/optimizable-image.ts (used by Photo and Markdown images).
 * We serve our own images from Cloudflare R2 (pub-*.r2.dev, or a custom public
 * URL) and, transitionally, legacy blog images from the Webflow CDN. AVIF/WebP
 * are enabled so multi-megabyte uploads are resized and re-encoded on the fly.
 */
function imageRemotePatterns() {
  const patterns: NonNullable<
    NonNullable<NextConfig["images"]>["remotePatterns"]
  > = [
    { protocol: "https", hostname: "**.r2.dev" },
    { protocol: "https", hostname: "**.website-files.com" },
    { protocol: "https", hostname: "uploads-ssl.webflow.com" },
  ];
  // A custom R2 public domain (S3_PUBLIC_URL) if one is configured.
  const publicUrl = process.env.S3_PUBLIC_URL;
  if (publicUrl) {
    try {
      const { hostname, protocol } = new URL(publicUrl);
      if (!patterns.some((p) => p.hostname === hostname)) {
        patterns.push({
          protocol: protocol.replace(":", "") as "http" | "https",
          hostname,
        });
      }
    } catch {
      // ignore an unparseable S3_PUBLIC_URL
    }
  }
  return patterns;
}

const nextConfig: NextConfig = {
  // Trailing-slash 308s are Next's, and they run before the proxy. Turning
  // them off lets the proxy fold the slash into the same 301 as host and
  // protocol. Repeated slashes (`//`, `//about//`) are a separate hardcoded
  // 308 in Next's router (resolve-routes) that no config flag disables,
  // including skipProxyUrlNormalize. That hop stays a 308.
  skipTrailingSlashRedirect: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: imageRemotePatterns(),
  },
  async headers() {
    return loadNoindexHeaders();
  },
  async rewrites() {
    // IndexNow key file: /<INDEXNOW_KEY>.txt is served by a route handler that
    // only answers for the real key (see src/lib/indexnow.ts). Runs after
    // files and pages, so robots.txt and anything in public/ win.
    return [
      {
        source: "/:key([a-zA-Z0-9-]{8,128})\\.txt",
        destination: "/api/indexnow/:key",
      },
    ];
  },
};

export default nextConfig;
