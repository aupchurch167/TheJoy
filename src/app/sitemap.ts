import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { hasDatabase } from "@/lib/db";
import { getPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/gallery`, changeFrequency: "monthly", priority: 0.4 },
  ];

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

  return entries;
}
