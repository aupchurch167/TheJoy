import Link from "next/link";
import { LATEST_POSTS } from "@/lib/site";

export type PostCard = { title: string; excerpt: string; href: string };

export default function LatestPosts({ posts }: { posts?: PostCard[] }) {
  // Use real published posts when available; otherwise the static teasers.
  const cards: PostCard[] =
    posts && posts.length > 0 ? posts : LATEST_POSTS;
  if (cards.length === 0) return null;

  return (
    <section id="stories" className="bg-white/60 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            Stories from Joy
          </h2>
          <Link
            href="/blog"
            className="hidden text-base font-semibold text-clay hover:text-clay-dark sm:inline"
          >
            Read more
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {cards.slice(0, 3).map((post, i) => (
            <Link
              key={i}
              href={post.href}
              className="group flex flex-col rounded-2xl bg-white p-7 shadow-sm ring-1 ring-line transition-shadow hover:shadow-md"
            >
              <h3 className="font-display text-xl font-semibold text-ink group-hover:text-clay">
                {post.title}
              </h3>
              <p className="mt-3 flex-1 text-base leading-relaxed text-ink-soft">
                {post.excerpt}
              </p>
              <span className="mt-4 text-sm font-semibold text-clay">
                Keep reading
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
