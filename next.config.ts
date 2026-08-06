import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 301 redirects for migrated Webflow URLs. Sourced from db/redirects.json so
 * old links (and their SEO) survive the move. The import script
 * (scripts/import-webflow.mjs) writes that file; edit it by hand for one-offs.
 * Applied at build time, so redeploy after changing it.
 */
function loadRedirects() {
  try {
    const raw = readFileSync(join(process.cwd(), "db", "redirects.json"), "utf8");
    const entries = JSON.parse(raw) as { from: string; to: string }[];
    return entries
      .filter((e) => e && e.from && e.to && e.from !== e.to)
      .map((e) => ({ source: e.from, destination: e.to, permanent: true }));
  } catch {
    return [];
  }
}

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
 * next/image remote hosts. Must be a SUPERSET of the allowlist in Photo.tsx.
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
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: imageRemotePatterns(),
  },
  async redirects() {
    return loadRedirects();
  },
  async headers() {
    return loadNoindexHeaders();
  },
};

export default nextConfig;
