import type { MetadataRoute } from "next";
import { SITE_URL, MEMORY_CARE, visibleServiceDetails } from "@/lib/site";
import { hasDatabase } from "@/lib/db";
import { getPublishedPosts } from "@/lib/posts";
import { LOGANVILLE_SERVING, TOWNS } from "@/lib/landing";
import { decideCanonical } from "@/lib/canonical-request";

export const dynamic = "force-dynamic";

/**
 * True when the proxy would serve this URL as-is (no 301 from
 * db/redirects.json, no 410). A published post whose slug was later folded
 * into another post still has a row, so this is what keeps redirect sources
 * out of the sitemap.
 */
function servesItself(url: string): boolean {
  const { host, protocol, pathname, search } = new URL(url);
  const decision = decideCanonical({
    method: "GET",
    hostHeader: host,
    forwardedProto: protocol.replace(":", ""),
    urlProtocol: protocol,
    pathname,
    search,
  });
  return decision.action === "next";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages have no stored content timestamp, so they omit <lastmod>.
  // Blog lastmod is posts.updated_at. RSVP, admin, and redirect sources are
  // not listed. Every URL here is a final 200 that is allowed to be indexed.
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/services`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/tour`, changeFrequency: "yearly", priority: 0.9 },
    { url: `${SITE_URL}/cost`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/reviews`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/when-its-time`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/tour-checklist`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/small-home-difference`, changeFrequency: "monthly", priority: 0.7 },
    {
      url: `${SITE_URL}/serving/${LOGANVILLE_SERVING.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    ...Object.keys(TOWNS).map((town) => ({
      url: `${SITE_URL}/serving/${town}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/gallery`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/partners`, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Memory care landing page (gated on the license, §4).
  if (MEMORY_CARE.enabled) {
    entries.push({
      url: `${SITE_URL}/memory-care`,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  // One entry per visible service detail page. Memory care is skipped here
  // because it lives at its own canonical /memory-care URL (added above), and
  // /services/memory-care redirects there.
  for (const service of visibleServiceDetails()) {
    if (service.slug === "memory-care") continue;
    entries.push({
      url: `${SITE_URL}/services/${service.slug}`,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  if (hasDatabase()) {
    try {
      const posts = await getPublishedPosts();
      for (const post of posts) {
        entries.push({
          url: `${SITE_URL}/blog/${post.slug}`,
          lastModified: post.updated_at
            ? new Date(post.updated_at)
            : undefined,
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    } catch {
      // If the DB is briefly unavailable, still return the static entries.
    }
  }

  // Assertion: only final 200s are listed. Anything the proxy would redirect
  // or mark gone is dropped here and logged so the cause can be fixed.
  return entries.filter((entry) => {
    if (servesItself(entry.url)) return true;
    console.warn(`[sitemap] dropped ${entry.url}: not a final 200`);
    return false;
  });
}
