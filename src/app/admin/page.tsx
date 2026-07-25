import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getAllPosts } from "@/lib/posts";
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

export default async function AdminDashboard() {
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
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/posts/${p.id}`}
                className="flex min-h-16 cursor-pointer items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">
                    {p.title || "(untitled)"}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-ink-faint">
                    /blog/{p.slug}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  {p.status === "scheduled" && p.published_at && (
                    <span className="hidden text-xs text-ink-faint sm:inline">
                      {formatDate(p.published_at)}
                    </span>
                  )}
                  <Badge tone={STATUS_TONE[p.status] ?? "neutral"}>
                    {p.status}
                  </Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
