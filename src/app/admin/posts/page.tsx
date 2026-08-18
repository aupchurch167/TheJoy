import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getAllPosts, type Post } from "@/lib/posts";
import { formatDate } from "@/lib/format";
import { PageHeader, ButtonLink, EmptyState, NotConnected } from "@/components/admin/ui";
import PostsList, { type PostItem } from "./PostsList";

export const dynamic = "force-dynamic";

/** The one date that matters at a glance, labeled by status. */
function whenLabel(p: Post): string {
  if (p.status === "published" && p.published_at)
    return `Published ${formatDate(p.published_at)}`;
  if (p.status === "scheduled" && p.published_at)
    return `Goes live ${formatDate(p.published_at)}`;
  return `Edited ${formatDate(p.updated_at)}`;
}

function readingTime(body: string): number {
  const words = (body || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function PostsPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Posts" description="Your blog, at Stories from Joy." />
        <NotConnected what="Posts" />
      </>
    );
  }

  const posts = await getAllPosts();

  if (posts.length === 0) {
    return (
      <>
        <PageHeader title="Posts" description="Your blog, published at Stories from Joy." />
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
      </>
    );
  }

  const items: PostItem[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    category: p.category,
    author: p.author || "Joy Senior Living",
    status: p.status as PostItem["status"],
    heroImage: p.hero_image,
    readingMin: readingTime(p.body),
    whenLabel: whenLabel(p),
  }));

  return <PostsList posts={items} />;
}
