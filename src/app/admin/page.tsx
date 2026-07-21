import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getAllPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-display text-2xl font-semibold text-ink">Posts</h1>
        <p className="mt-4 rounded-lg bg-clay/10 px-4 py-3 text-clay-dark">
          The database is not connected yet. Set DATABASE_URL and run{" "}
          <code>npm run migrate</code> (see OPERATIONS.md).
        </p>
      </div>
    );
  }

  const posts = await getAllPosts();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-full bg-clay px-4 py-2 text-sm font-semibold text-white hover:bg-clay-dark"
        >
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-lg border border-line bg-white px-5 py-8 text-center text-ink-soft">
          No posts yet. Write your first one, or draft it with AI.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/posts/${p.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-paper"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">
                    {p.title || "(untitled)"}
                  </span>
                  <span className="block truncate text-sm text-ink-faint">
                    /blog/{p.slug}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    p.status === "published"
                      ? "bg-sage/15 text-sage"
                      : p.status === "scheduled"
                        ? "bg-gold/15 text-gold"
                        : "bg-line/70 text-ink-faint"
                  }`}
                >
                  {p.status === "scheduled" && p.published_at
                    ? `scheduled ${new Date(p.published_at).toLocaleDateString()}`
                    : p.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
