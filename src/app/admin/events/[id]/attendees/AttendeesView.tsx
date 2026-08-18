"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { removeRsvp, createEventEmailDraft } from "../../actions";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { useToast } from "@/components/admin/Toast";

export type AttendeeRow = {
  id: string;
  name: string;
  response: "yes" | "no" | "maybe";
  guests: number;
  bringing: string | null;
  note: string | null;
  email: string | null;
  phone: string | null;
};

type Counts = { yes: number; no: number; maybe: number; headcount: number };

const BADGE: Record<string, { label: string; bg: string; col: string }> = {
  yes: { label: "Coming", bg: "rgba(36,163,50,.12)", col: "#1c7f27" },
  maybe: { label: "Maybe", bg: "rgba(183,121,31,.12)", col: "#8a6217" },
  no: { label: "Can't make it", bg: "#eef2f3", col: "#626d70" },
};

const FILTERS = [
  { id: "all", label: "Everyone" },
  { id: "yes", label: "Coming" },
  { id: "maybe", label: "Maybe" },
  { id: "no", label: "Can't make it" },
] as const;

export default function AttendeesView({
  eventId,
  title,
  summary,
  isPotluck,
  capacity,
  counts,
  rows,
}: {
  eventId: string;
  title: string;
  summary: string;
  isPotluck: boolean;
  capacity: number;
  counts: Counts;
  rows: AttendeeRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [pending, start] = useTransition();

  const shown = rows.filter((r) => filter === "all" || r.response === filter);
  const dishCount = rows.filter((r) => r.bringing).length;
  const pct = capacity > 0 ? Math.min(100, Math.round((counts.headcount / capacity) * 100)) : 0;

  function sendReminder() {
    start(async () => {
      const res = await createEventEmailDraft({ eventId, kind: "reminder" });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.push(`/admin/emails/${res.id}`);
    });
  }

  return (
    <div className="mx-auto max-w-[960px]">
      <Link
        href={`/admin/events/${eventId}`}
        className="mb-3.5 inline-flex items-center gap-2 text-sm font-semibold text-clay-dark hover:underline"
      >
        <span className="text-[15px]">←</span> {title}
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold text-ink">Who&apos;s coming</h1>
          <p className="mt-1 text-[13.5px] text-ink-soft">{summary}</p>
        </div>
        <div className="flex flex-none gap-2">
          <button
            type="button"
            onClick={sendReminder}
            disabled={pending}
            className="rounded-[9px] border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink-soft hover:bg-surface hover:text-ink disabled:opacity-60"
          >
            {pending ? "Preparing…" : "⏰ Send a reminder"}
          </button>
          <Link
            href={`/admin/events/${eventId}/roster`}
            className="inline-flex items-center gap-1.5 rounded-[9px] border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:bg-surface"
          >
            🖨 Print / save PDF
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat value={counts.headcount} label="headcount (with guests)" color="#1c7f27" />
        <Stat value={counts.yes} label="said yes" color="#071417" />
        <Stat value={counts.maybe} label="maybe" color="#b7791f" />
        <Stat value={counts.no} label="can't make it" color="#97a0a3" />
      </div>
      {capacity > 0 && (
        <div className="mb-5">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-sage" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 text-[11.5px] text-ink-faint">
            {counts.headcount} of {capacity} spots spoken for
          </div>
        </div>
      )}

      {/* Filters + dishes */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="admin-scroll-x -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`flex-none whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-soft hover:bg-paper"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        {isPotluck && (
          <div className="text-xs text-ink-faint">
            🍲 Potluck — {dishCount} dish{dishCount === 1 ? "" : "es"} coming so far
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(7,20,23,0.04)]">
        <div className="hidden grid-cols-[1.4fr_0.9fr_0.5fr_1.2fr_1fr_44px] gap-3 border-b border-line bg-paper px-[18px] py-2.5 sm:grid">
          {["Name", "Response", "Party", "Bringing", "Contact", ""].map((h, i) => (
            <span key={i} className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink-faint">
              {h}
            </span>
          ))}
        </div>
        {shown.length === 0 ? (
          <div className="px-4 py-7 text-center text-sm text-ink-faint">
            No one in this group yet.
          </div>
        ) : (
          shown.map((r) => {
            const b = BADGE[r.response];
            return (
              <div
                key={r.id}
                className="relative flex flex-col gap-2 border-b border-line px-4 py-3.5 last:border-b-0 hover:bg-paper sm:grid sm:grid-cols-[1.4fr_0.9fr_0.5fr_1.2fr_1fr_44px] sm:items-center sm:gap-3 sm:px-[18px] sm:py-3"
              >
                <div className="min-w-0 pr-8 sm:pr-0">
                  <div className="text-[13.5px] font-semibold text-ink">{r.name}</div>
                  {r.note && (
                    <div className="truncate text-[11.5px] text-ink-faint">“{r.note}”</div>
                  )}
                </div>
                <div>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    style={{ background: b.bg, color: b.col }}
                  >
                    {b.label}
                  </span>
                </div>
                <div className="text-[13px] text-ink-soft">
                  <span className="mr-1 text-[11px] text-ink-faint sm:hidden">Party:</span>
                  {r.response === "yes" ? 1 + r.guests : "—"}
                </div>
                <div
                  className="text-[12.5px] sm:truncate"
                  style={{ color: r.bringing ? "#071417" : "#c6cdd0" }}
                >
                  <span className="mr-1 text-[11px] text-ink-faint sm:hidden">Bringing:</span>
                  {r.bringing || "—"}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-ink-soft sm:truncate">{r.email || "—"}</div>
                  {r.phone && <div className="text-[11px] text-ink-faint">{r.phone}</div>}
                </div>
                <div className="absolute right-2 top-2 sm:static sm:text-right">
                  <ConfirmButton
                    variant="ghost"
                    size="sm"
                    title="Remove this RSVP?"
                    message="This deletes their response. They can RSVP again from the link."
                    confirmLabel="Remove"
                    onConfirm={async () => {
                      const res = await removeRsvp(r.id);
                      if (res.ok) {
                        toast.success("RSVP removed.");
                        router.refresh();
                      } else {
                        toast.error("Could not remove it.");
                      }
                    }}
                  >
                    ✕
                  </ConfirmButton>
                </div>
              </div>
            );
          })
        )}
      </div>
      <p className="mt-2.5 text-xs text-ink-faint">
        The printable roster includes the event details, this list, and blank walk-in
        lines, handy on a clipboard by the door.
      </p>
    </div>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-xl border border-line bg-white px-4 py-3">
      <div className="text-[22px] font-bold" style={{ color }}>
        {value}
      </div>
      <div className="mt-0.5 text-[11.5px] text-ink-faint">{label}</div>
    </div>
  );
}
