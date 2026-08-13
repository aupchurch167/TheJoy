"use client";

import { useCallback, useEffect } from "react";
import { Badge } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import type { ReadableResponse } from "@/lib/feedback";

const DIM_VALUE: Record<number, string> = { 1: "Needs work", 2: "Okay", 3: "Great" };
const RECOMMEND: Record<string, string> = {
  definitely: "Definitely",
  probably: "Probably",
  not_sure: "Not sure",
  no: "No",
};

/**
 * Full-screen reader for stepping through completed responses one at a time
 * with Previous / Next (and arrow keys). `rows` are the detail rows only.
 */
export default function ResponseReader({
  rows,
  index,
  onIndex,
  onClose,
}: {
  rows: ReadableResponse[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const r = rows[index];
  const atStart = index <= 0;
  const atEnd = index >= rows.length - 1;

  const prev = useCallback(() => {
    if (index > 0) onIndex(index - 1);
  }, [index, onIndex]);
  const next = useCallback(() => {
    if (index < rows.length - 1) onIndex(index + 1);
  }, [index, rows.length, onIndex]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, onClose]);

  if (!r) return null;

  const concern = r.sentiment === "concern";
  const dims: [string, number | null][] = [
    ["Care", r.rating_care],
    ["Communication", r.rating_communication],
    ["Meals and dining", r.rating_dining],
    ["Feels like home", r.rating_home_feel],
    ["Activities", r.rating_engagement],
  ];
  const answers: [string, string | null][] = [
    ["What is going well", r.going_well],
    ["What could be better", r.could_be_better],
    ["Suggestions", r.suggestions],
  ];
  const hasAnswers = answers.some(([, v]) => v);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">
              {r.is_anonymous || !r.family_name ? "Anonymous" : r.family_name}
            </p>
            <p className="text-xs text-ink-faint">{formatDate(r.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-xs text-ink-faint">
              {index + 1} of {rows.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-ink-faint hover:bg-surface hover:text-ink"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xl font-medium text-clay">
              {"♥".repeat(r.overall_rating)}
              <span className="text-ink-faint">
                {"♥".repeat(5 - r.overall_rating)}
              </span>
            </span>
            {r.is_anonymous && <Badge tone="neutral">anonymous</Badge>}
            <Badge tone={concern ? "danger" : "success"}>
              {concern ? "concern" : "positive"}
            </Badge>
            {r.would_recommend && (
              <span className="text-sm text-ink-soft">
                Would recommend: {RECOMMEND[r.would_recommend]}
              </span>
            )}
          </div>

          {/* Dimensions */}
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Ratings
            </p>
            <ul className="space-y-1 text-sm">
              {dims.map(([lbl, v]) => (
                <li key={lbl} className="flex justify-between gap-3">
                  <span className="text-ink-soft">{lbl}</span>
                  <span className={v === 1 ? "font-medium text-danger" : "text-ink"}>
                    {v != null ? DIM_VALUE[v] : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Written answers */}
          <div className="mt-4 space-y-3">
            {hasAnswers ? (
              answers.map(([lbl, v]) =>
                v ? (
                  <div key={lbl}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      {lbl}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink">{v}</p>
                  </div>
                ) : null
              )
            ) : (
              <p className="text-sm text-ink-faint">
                This family left ratings but no written comments.
              </p>
            )}
          </div>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
          <button
            type="button"
            onClick={prev}
            disabled={atStart}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={next}
            disabled={atEnd}
            className="rounded-lg bg-clay px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-clay-dark disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
