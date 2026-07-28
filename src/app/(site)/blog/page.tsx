import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "@/lib/site";
import { getSettings } from "@/lib/settings";
import { hasDatabase } from "@/lib/db";
import { getPublishedPosts } from "@/lib/posts";
import Photo from "@/components/Photo";
import LeadForm from "@/components/LeadForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stories from Joy",
  description:
    "Honest, plainspoken writing for families thinking about senior living and memory care near Loganville, Georgia.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndex() {
  const [posts, settings] = await Promise.all([
    hasDatabase() ? getPublishedPosts() : Promise.resolve([]),
    getSettings(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-ink">
          Stories from Joy
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          Honest notes for families thinking about senior living and memory care
          near Loganville. When care is discussed, that is{" "}
          {BUSINESS.director.name}, our Executive Director.
        </p>
      </div>

      {/* Posts on the left, a sticky quick-contact form on the right. */}
      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {posts.length === 0 ? (
            <p className="rounded-2xl border border-line bg-white px-6 py-10 text-center text-ink-soft">
              New writing is on the way. In the meantime, the best way to learn
              about Joy is to come see it. Call {BUSINESS.director.name} at{" "}
              <a href={BUSINESS.phoneHref} className="font-semibold text-clay">
                {BUSINESS.phone}
              </a>
              .
            </p>
          ) : (
            <div className="grid gap-8">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group grid gap-5 rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-md sm:grid-cols-[200px_1fr]"
                >
                  {post.hero_image ? (
                    <Photo
                      src={post.hero_image}
                      alt={post.hero_image_alt || post.title}
                      className="aspect-[4/3] w-full"
                    />
                  ) : (
                    <div className="hidden sm:block" />
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-x-3 text-xs">
                      {post.category && (
                        <span className="font-semibold uppercase tracking-wide text-clay">
                          {post.category}
                        </span>
                      )}
                      {post.published_at && (
                        <time
                          dateTime={post.published_at}
                          className="text-ink-faint"
                        >
                          {new Date(post.published_at).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" }
                          )}
                        </time>
                      )}
                    </div>
                    <h2 className="mt-1 font-display text-2xl font-semibold text-ink group-hover:text-clay">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 leading-relaxed text-ink-soft">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick-action CTA. Sticky on desktop, stacks under the posts on
            mobile. Posts to the same lead pipeline, tagged as the blog form. */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <LeadForm
              compact
              source="blog_form"
              heading="Get in touch with us"
              blurb={`Thinking it might be time? Tell us a little about your parent and we will call you back. Or call ${BUSINESS.director.name} at ${settings.phone}.`}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
