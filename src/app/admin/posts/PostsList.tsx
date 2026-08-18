"use client";

import { useState } from "react";
import Link from "next/link";

export type PostItem = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  author: string;
  status: "published" | "scheduled" | "draft";
  heroImage: string | null;
  readingMin: number;
  whenLabel: string; // e.g. "Published Aug 14"
};

const BADGE: Record<string, { label: string; bg: string; col: string }> = {
  published: { label: "Published", bg: "rgba(36,163,50,.12)", col: "#1c7f27" },
  scheduled: { label: "Scheduled", bg: "rgba(183,121,31,.12)", col: "#8a6217" },
  draft: { label: "Draft", bg: "#eef2f3", col: "#626d70" },
};

export default function PostsList({ posts }: { posts: PostItem[] }) {
  const [filter, setFilter] = useState<"all" | "published" | "scheduled" | "draft">("all");

  const counts = {
    all: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    draft: posts.filter((p) => p.status === "draft").length,
  };
  const FILTERS = [
    { id: "all", label: `All (${counts.all})` },
    { id: "published", label: `Published (${counts.published})` },
    { id: "scheduled", label: `Scheduled (${counts.scheduled})` },
    { id: "draft", label: `Drafts (${counts.draft})` },
  ] as const;

  const shown = posts.filter((p) => filter === "all" || p.status === filter);

  return (
    <div className="mx-auto max-w-[960px]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold text-ink">Posts</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Stories from Joy, your blog for families and folks finding you.
          </p>
        </div>
        <div className="flex flex-none gap-2">
          <Link
            href="/admin/posts/new?ai=1"
            className="rounded-[10px] bg-clay px-4 py-2.5 text-sm font-bold text-white shadow-[0_2px_6px_rgba(1,167,206,0.35)] hover:opacity-95"
          >
            ✦ Write with AI
          </Link>
          <Link
            href="/admin/posts/new"
            className="rounded-[10px] border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface"
          >
            New post
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const on = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-soft hover:bg-paper"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2.5">
        {shown.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white px-6 py-10 text-center text-sm text-ink-faint shadow-sm">
            Nothing here yet.
          </div>
        ) : (
          shown.map((p) => {
            const b = BADGE[p.status];
            const needsHero = p.status === "draft" && !p.heroImage;
            return (
              <Link
                key={p.id}
                href={`/admin/posts/${p.id}`}
                className="flex items-center gap-4 rounded-2xl border border-line bg-white px-4 py-3 shadow-[0_1px_3px_rgba(7,20,23,0.04)] transition-shadow hover:border-clay hover:shadow-[0_3px_10px_rgba(7,20,23,0.08)]"
              >
                <span className="flex h-16 w-[92px] flex-none items-center justify-center overflow-hidden rounded-[9px] border border-line bg-surface">
                  {p.heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.heroImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg text-ink-faint">✍️</span>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14.5px] font-semibold text-ink">
                      {p.title || "(untitled)"}
                    </span>
                    {p.category && (
                      <span className="flex-none rounded-full bg-clay/[0.12] px-2 py-0.5 text-[10.5px] font-bold text-clay-dark">
                        {p.category}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ink-faint">
                    /blog/{p.slug} · {p.author} · {p.readingMin} min read
                  </span>
                  {needsHero && (
                    <span className="mt-0.5 block text-xs text-[#8a6217]">
                      → No hero photo yet. Add one before publishing.
                    </span>
                  )}
                </span>

                <span className="flex flex-none flex-col items-end gap-1.5">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
                    style={{ background: b.bg, color: b.col }}
                  >
                    {b.label}
                  </span>
                  <span className="whitespace-nowrap text-[11.5px] text-ink-faint">
                    {p.whenLabel}
                  </span>
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
