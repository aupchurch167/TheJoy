import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasDatabase } from "@/lib/db";
import { getPublishedPostBySlug, getPublishedPosts } from "@/lib/posts";
import { pickRelatedPosts } from "@/lib/related-posts";
import { MEMORY_CARE } from "@/lib/site";
import { articleJsonLd, breadcrumbJsonLd, authorByline } from "@/lib/schema";
import { BUSINESS, OG_IMAGE } from "@/lib/site";
import { pageTwitter } from "@/lib/metadata";
import { isoDateTime, publicDescription } from "@/lib/post-description";
import { getSettings, tourHref } from "@/lib/settings";
import Markdown from "@/components/Markdown";
import Photo from "@/components/Photo";
import TourButton from "@/components/TourButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = hasDatabase() ? await getPublishedPostBySlug(slug) : null;
  if (!post) return pageTwitter({ title: "Not found", robots: { index: false } });

  const description = publicDescription(post);
  // published_at comes back from pg as a Date. Passing that object through
  // makes article:published_time render as "[object Object]".
  return pageTwitter({
    title: post.meta_title || post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.meta_title || post.title,
      description,
      type: "article",
      url: `/blog/${post.slug}`,
      images: post.hero_image ? [post.hero_image] : [OG_IMAGE],
      publishedTime: isoDateTime(post.published_at),
    },
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = hasDatabase() ? await getPublishedPostBySlug(slug) : null;
  if (!post) notFound();
  const settings = await getSettings();

  // Related reading: 4 other published posts (same category or shared
  // words in the title), as plain <a href> links. Targets are published posts.
  const related = pickRelatedPosts(
    post,
    hasDatabase() ? await getPublishedPosts() : [],
    4
  );
  const isMemoryTopic = /memory|dementia|alzheimer/i.test(
    `${post.category ?? ""} ${post.title} ${post.slug}`
  );
  const carePage =
    isMemoryTopic && MEMORY_CARE.enabled
      ? { href: "/memory-care", label: "memory care at Joy" }
      : { href: "/services", label: "how Joy cares for residents" };

  return (
    <article className="mx-auto max-w-2xl px-5 py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd(post)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Stories from Joy", path: "/blog" },
              { name: post.title, path: `/blog/${post.slug}` },
            ])
          ),
        }}
      />

      <Link
        href="/blog"
        className="text-sm font-semibold text-clay hover:text-clay-dark"
      >
        &larr; Stories from Joy
      </Link>

      {post.category && (
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-clay">
          {post.category}
        </p>
      )}
      <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-ink">
        {post.title}
      </h1>
      <p className="mt-3 text-sm text-ink-faint">By {authorByline(post.author)}</p>

      {post.hero_image && (
        <Photo
          src={post.hero_image}
          alt={post.hero_image_alt || post.title}
          priority
          className="mt-8 aspect-[16/9] w-full ring-1 ring-line"
        />
      )}

      <div className="mt-10">
        <Markdown>{post.body}</Markdown>
      </div>

      {/* Contextual internal link into the right care page. */}
      <p className="mt-12 border-l-2 border-clay pl-5 text-lg leading-relaxed text-ink-soft">
        Learn more about{" "}
        <Link href={carePage.href} className="font-semibold text-clay underline">
          {carePage.label}
        </Link>
        , a personal care home in {BUSINESS.address.city}, {BUSINESS.address.state}.
      </p>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-ink">
            Related reading
          </h2>
          <ul className="mt-5 space-y-3">
            {related.map((p) => (
              <li key={p.id}>
                <a
                  href={`/blog/${p.slug}`}
                  className="font-display text-lg font-semibold text-ink underline decoration-clay/40 underline-offset-2 hover:text-clay"
                >
                  {p.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Single tour path CTA at the end of every post. */}
      <div className="mt-14 rounded-2xl bg-ink px-6 py-8 text-center text-white">
        <p className="font-display text-2xl font-semibold">
          Come see the home
        </p>
        <p className="mx-auto mt-2 max-w-md text-white/80">
          The best way to know if Joy is right for your parent is to walk through
          it. Book a tour, or call us at {BUSINESS.phone}.
        </p>
        <div className="mt-5">
          <TourButton variant="light" href={tourHref(settings)}>
            Book a tour
          </TourButton>
        </div>
      </div>
    </article>
  );
}
