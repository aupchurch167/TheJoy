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

const nextConfig: NextConfig = {
  async redirects() {
    return loadRedirects();
  },
};

export default nextConfig;
