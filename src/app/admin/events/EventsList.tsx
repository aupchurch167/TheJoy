"use client";

import { useState } from "react";
import Link from "next/link";

export type EventListItem = {
  id: string;
  title: string;
  /** draft | published | cancelled | done (published + past). */
  status: "draft" | "published" | "cancelled" | "done";
  month: string;
  day: string;
  when: string;
  where: string;
  isPotluck: boolean;
  headcount: number;
  yes: number;
  capacity: number;
};

const BADGE: Record<string, { label: string; bg: string; col: string }> = {
  published: { label: "Invites out", bg: "rgba(36,163,50,.12)", col: "#1c7f27" },
  draft: { label: "Draft", bg: "#eef2f3", col: "#626d70" },
  cancelled: { label: "Cancelled", bg: "rgba(207,70,54,.1)", col: "#cf4636" },
  done: { label: "Happened", bg: "#eef2f3", col: "#97a0a3" },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Coming up" },
  { id: "drafts", label: "Drafts" },
  { id: "past", label: "Past" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export default function EventsList({ events }: { events: EventListItem[] }) {
  const [filter, setFilter] = useState<FilterId>("all");

  const upcomingAll = events.filter(
    (e) => e.status === "published" || e.status === "draft"
  );
  const pastAll = events.filter(
    (e) => e.status === "done" || e.status === "cancelled"
  );

  const upcoming = upcomingAll.filter((e) =>
    filter === "all"
      ? true
      : filter === "upcoming"
        ? e.status === "published"
        : filter === "drafts"
          ? e.status === "draft"
          : false
  );
  const past = filter === "all" || filter === "past" ? pastAll : [];

  return (
    <div className="mx-auto max-w-[960px]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold text-ink">Events</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Create an event, send invites, and see who&apos;s coming.
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="flex-none rounded-[10px] bg-clay px-4 py-2.5 text-sm font-bold text-white shadow-[0_2px_6px_rgba(1,167,206,0.35)] hover:opacity-95"
        >
          ＋ New event
        </Link>
      </div>

      <div className="mb-5 flex gap-1.5">
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

      {events.length === 0 && (
        <div className="rounded-2xl border border-line bg-white px-6 py-12 text-center shadow-sm">
          <div className="text-3xl">🎉</div>
          <p className="mt-2 font-semibold text-ink">No events yet</p>
          <p className="mt-1 text-sm text-ink-soft">
            Create a support group, birthday party, or dinner, then send the invites.
          </p>
        </div>
      )}

      {upcoming.length > 0 && (
        <>
          <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
            Coming up
          </div>
          <div className="mb-7 flex flex-col gap-2.5">
            {upcoming.map((e) => (
              <UpcomingCard key={e.id} e={e} />
            ))}
          </div>
        </>
      )}

      {past.length > 0 && (
        <>
          <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
            Past &amp; cancelled
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(7,20,23,0.04)]">
            {past.map((e) => {
              const b = BADGE[e.status];
              return (
                <Link
                  key={e.id}
                  href={`/admin/events/${e.id}`}
                  className="flex items-center justify-between gap-3.5 border-b border-line px-5 py-3 last:border-b-0 hover:bg-paper"
                  style={{ opacity: e.status === "cancelled" ? 0.65 : 1 }}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="truncate text-sm font-semibold text-ink"
                      style={{ textDecoration: e.status === "cancelled" ? "line-through" : "none" }}
                    >
                      {e.title}
                    </span>
                    <span
                      className="flex-none rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                      style={{ background: b.bg, color: b.col }}
                    >
                      {b.label}
                    </span>
                  </div>
                  <div className="flex flex-none items-center gap-3.5">
                    <span className="text-xs text-ink-faint">{e.when}</span>
                    <span className="min-w-[74px] text-right text-xs text-ink-soft">
                      {e.status === "done"
                        ? `${e.headcount} came`
                        : "—"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function UpcomingCard({ e }: { e: EventListItem }) {
  const b = BADGE[e.status];
  const isDraft = e.status === "draft";
  const pct = e.capacity > 0 ? Math.min(100, Math.round((e.headcount / e.capacity) * 100)) : 0;
  return (
    <Link
      href={`/admin/events/${e.id}`}
      className="flex items-center gap-4 rounded-2xl border border-line bg-white px-[18px] py-3.5 shadow-[0_1px_3px_rgba(7,20,23,0.04)] transition-shadow hover:border-clay hover:shadow-[0_3px_10px_rgba(7,20,23,0.08)]"
    >
      <div className="flex-none rounded-[10px] border border-line bg-paper px-2 py-1.5 text-center" style={{ width: 52 }}>
        <div
          className="text-[9.5px] font-bold uppercase tracking-[0.08em]"
          style={{ color: isDraft ? "#97a0a3" : "#017391" }}
        >
          {e.month}
        </div>
        <div className="font-display text-xl font-semibold leading-tight text-ink">{e.day}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14.5px] font-semibold text-ink">{e.title}</span>
          <span
            className="flex-none rounded-full px-2 py-0.5 text-[10.5px] font-bold"
            style={{ background: b.bg, color: b.col }}
          >
            {b.label}
          </span>
          {e.isPotluck && (
            <span className="flex-none rounded-full bg-gold/15 px-2 py-0.5 text-[10.5px] font-bold text-[#c98a2c]">
              🍲 Potluck
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-xs text-ink-faint">
          {e.when}
          {e.where ? ` · ${e.where}` : ""}
        </div>
        {isDraft && (
          <div className="mt-1 text-xs text-[#8a6217]">
            → Not public yet. Finish the details and send the invite.
          </div>
        )}
      </div>
      <div className="min-w-[120px] flex-none text-right">
        {isDraft ? (
          <span className="inline-block rounded-[9px] border border-line px-3 py-1.5 text-xs font-semibold text-clay-dark">
            Finish &amp; invite →
          </span>
        ) : (
          <>
            <div
              className="text-[15px] font-bold"
              style={{ color: e.headcount > 0 ? "#1c7f27" : "#97a0a3" }}
            >
              {e.headcount} coming
            </div>
            <div className="mt-0.5 text-[11.5px] text-ink-faint">
              {e.yes} yes{e.capacity > 0 ? ` · ${e.capacity} max` : ""}
            </div>
            {e.capacity > 0 && (
              <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: pct >= 90 ? "#b7791f" : "#24a332" }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Link>
  );
}
