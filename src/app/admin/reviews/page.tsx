import Link from "next/link";
import { PageHeader, EmptyState, NotConnected } from "@/components/admin/ui";
import { hasDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import {
  listReviews,
  listReviewSources,
  countReviewsByStatus,
  type ReviewStatus,
} from "@/lib/reviews";
import ReviewList from "./ReviewList";
import ReviewSourcesEditor from "./ReviewSourcesEditor";

export const dynamic = "force-dynamic";

const TABS: { key: ReviewStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "published", label: "Published" },
  { key: "hidden", label: "Hidden" },
  { key: "all", label: "All" },
];

export default async function ReviewsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const active = (
    ["pending", "published", "hidden", "all"].includes(sp.status || "")
      ? sp.status
      : "pending"
  ) as ReviewStatus | "all";

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Reviews" description="Approve and publish reviews" />
        <NotConnected what="Reviews" />
      </>
    );
  }

  const [reviews, sources, counts] = await Promise.all([
    listReviews(active === "all" ? undefined : active),
    listReviewSources(),
    countReviewsByStatus(),
  ]);

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Reviews submitted by integrations land here as pending. Approve to publish them on the site."
      />

      {/* Status tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const on = active === t.key;
          const count =
            t.key === "all"
              ? counts.pending + counts.published + counts.hidden
              : counts[t.key];
          return (
            <Link
              key={t.key}
              href={`/admin/reviews${t.key === "pending" ? "" : `?status=${t.key}`}`}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                on
                  ? "bg-clay/10 text-clay"
                  : "text-ink-soft hover:bg-surface hover:text-ink"
              }`}
            >
              {t.label}
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs ${
                  on ? "bg-clay/15 text-clay" : "bg-line/70 text-ink-soft"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon="⭐"
          title={
            active === "pending"
              ? "Nothing waiting for approval"
              : "No reviews here"
          }
          description={
            active === "pending"
              ? "When GrokBot (or another integration) submits reviews, they appear here to approve."
              : "Try another tab."
          }
        />
      ) : (
        <ReviewList reviews={reviews} />
      )}

      <div className="mt-10 border-t border-line pt-8">
        <ReviewSourcesEditor sources={sources} />
      </div>
    </>
  );
}
