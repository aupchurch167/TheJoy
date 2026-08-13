import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getAllPosts, type Post } from "@/lib/posts";
import { formatDate } from "@/lib/format";
import {
  PageHeader,
  ButtonLink,
  Badge,
  EmptyState,
  NotConnected,
  type BadgeTone,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, BadgeTone> = {
  published: "success",
  scheduled: "warning",
  draft: "neutral",
};

/**
 * The one date that matters at a glance, labeled by status: when a published
 * post went live, when a scheduled one goes live, or when a draft was last
 * touched.
 */
function whenLabel(p: Post): { label: string; value: string } | null {
  if (p.status === "published" && p.published_at)
    return { label: "Published", value: formatDate(p.published_at) };
  if (p.status === "scheduled" && p.published_at)
    return { label: "Goes live", value: formatDate(p.published_at) };
  return { label: "Edited", value: formatDate(p.updated_at) };
}

function readingTime(body: string): number {
  const words = (body || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function PostsPage() {
  await requireAdmin();

  const actions = (
    <>
      <ButtonLink href="/admin/posts/new?ai=1" variant="primary" size="sm">
        ✨ Write with AI
      </ButtonLink>
      <ButtonLink href="/admin/posts/new" variant="secondary" size="sm">
        New post
      </ButtonLink>
    </>
  );

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Posts" description="Your blog, at Stories from Joy." />
        <NotConnected what="Posts" />
      </>
    );
  }

  const posts = await getAllPosts();
  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.filter((p) => p.status === "draft").length;
  const scheduled = posts.filter((p) => p.status === "scheduled").length;

  return (
    <>
      <PageHeader
        title="Posts"
        description={
          posts.length > 0
            ? `${posts.length} total · ${published} published · ${scheduled} scheduled · ${drafts} draft`
            : "Your blog, published at Stories from Joy."
        }
        actions={actions}
      />

      {posts.length === 0 ? (
        <EmptyState
          icon="✍️"
          title="No posts yet"
          description="Write your first story for families, or let AI draft one in Joy's voice for you to edit."
          action={
            <ButtonLink href="/admin/posts/new?ai=1" variant="primary">
              ✨ Write with AI
            </ButtonLink>
          }
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-sm">
          {posts.map((p) => {
            const when = whenLabel(p);
            return (
              <li key={p.id}>
                <Link
                  href={`/admin/posts/${p.id}`}
                  className="flex min-h-16 cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-surface"
                >
                  {/* Hero thumbnail (or a quiet placeholder) for a fast scan. */}
                  <span className="hidden h-14 w-20 shrink-0 overflow-hidden rounded-md border border-line bg-surface sm:block">
                    {p.hero_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.hero_image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-ink-faint">
                        ✍️
                      </span>
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium text-ink">
                        {p.title || "(untitled)"}
                      </span>
                      {p.category && (
                        <Badge tone="info">{p.category}</Badge>
                      )}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-faint">
                      <span className="truncate">/blog/{p.slug}</span>
                      <span aria-hidden>·</span>
                      <span className="whitespace-nowrap">
                        {p.author || "Joy Senior Living"}
                      </span>
                      <span aria-hidden>·</span>
                      <span className="whitespace-nowrap">
                        {readingTime(p.body)} min read
                      </span>
                    </span>
                  </span>

                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge tone={STATUS_TONE[p.status] ?? "neutral"}>
                      {p.status}
                    </Badge>
                    {when && (
                      <span className="whitespace-nowrap text-xs text-ink-faint">
                        {when.label} {when.value}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
