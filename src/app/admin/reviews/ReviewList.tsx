"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Badge, Button, Card } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { useToast } from "@/components/admin/Toast";
import { formatDate } from "@/lib/format";
import { REVIEW_SOURCE_LABEL, type Review } from "@/lib/reviews-vocab";
import {
  setReviewStatusAction,
  toggleReviewFeatured,
  deleteReviewAction,
} from "./actions";

const STATUS_TONE = {
  pending: "warning",
  published: "success",
  hidden: "neutral",
} as const;

export default function ReviewList({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [pending, start] = useTransition();

  function act(fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) {
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        toastError(res.error ?? "Something went wrong.");
        return;
      }
      success(msg);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <Card key={r.id}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">
              {REVIEW_SOURCE_LABEL[r.source] ?? r.source}
            </Badge>
            {r.rating && (
              <span className="text-sm font-semibold text-gold">
                {"★".repeat(Math.round(Number(r.rating)))}
                <span className="ml-1 text-ink-faint">{r.rating}</span>
              </span>
            )}
            <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
            {r.featured && <Badge tone="violet">Featured</Badge>}
            <span className="ml-auto text-xs text-ink-faint">
              {r.review_date ? formatDate(r.review_date) : formatDate(r.created_at)}
            </span>
          </div>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {r.body}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
            {r.author && <span className="font-medium text-ink-soft">{r.author}</span>}
            {r.url && (
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-clay hover:text-clay-dark"
              >
                View source
              </a>
            )}
            {r.submitted_by && <span>via {r.submitted_by}</span>}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {r.status !== "published" && (
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  act(() => setReviewStatusAction(r.id, "published"), "Published.")
                }
              >
                Approve &amp; publish
              </Button>
            )}
            {r.status === "published" && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    act(() => toggleReviewFeatured(r.id, !r.featured), r.featured ? "Unfeatured." : "Featured.")
                  }
                >
                  {r.featured ? "Unfeature" : "Feature"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    act(() => setReviewStatusAction(r.id, "hidden"), "Hidden.")
                  }
                >
                  Unpublish
                </Button>
              </>
            )}
            {r.status !== "hidden" && r.status !== "published" && (
              <Button
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() =>
                  act(() => setReviewStatusAction(r.id, "hidden"), "Hidden.")
                }
              >
                Hide
              </Button>
            )}
            <ConfirmButton
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger/10 hover:text-danger-dark"
              title="Delete this review?"
              message="This permanently removes the review. This cannot be undone."
              confirmLabel="Delete"
              onConfirm={async () => {
                const res = await deleteReviewAction(r.id);
                if (res.ok) {
                  success("Deleted.");
                  router.refresh();
                } else {
                  toastError(res.error ?? "Could not delete.");
                }
              }}
            >
              Delete
            </ConfirmButton>
          </div>
        </Card>
      ))}
    </div>
  );
}
