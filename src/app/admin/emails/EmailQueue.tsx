"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { useToast } from "@/components/admin/Toast";
import { removeBroadcast } from "./actions";
import { formatDateTime } from "@/lib/format";

export type QueueItem = {
  id: string;
  subject: string;
  audience: "leads" | "families";
  status: "scheduled" | "sending";
  scheduledAt: string | null;
  /** Recipients this send targets. */
  expected: number;
  /** How many have already gone out (for a partially-sent blast). */
  sentSoFar: number;
  priority: boolean;
  isResend: boolean;
  dueNow: boolean;
};

export default function EmailQueue({
  items,
  withinWindow,
  throttle,
  nextOpen,
  workerHealthy = true,
}: {
  items: QueueItem[];
  withinWindow: boolean;
  throttle: string;
  /** "8am EDT" when the metered window is closed, else null. */
  nextOpen?: string | null;
  /** False when the sending worker hasn't run recently (nothing will send). */
  workerHealthy?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  if (items.length === 0) return null;

  // Flag likely accidental duplicates: same subject + audience queued more than once.
  const seen = new Map<string, number>();
  for (const it of items) {
    const k = `${it.audience}::${it.subject.trim().toLowerCase()}`;
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  const dupKeys = new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));

  async function cancel(id: string) {
    const res = await removeBroadcast(id);
    if (res.ok) {
      toast.success("Canceled and removed from the queue.");
      router.refresh();
    } else {
      toast.error("Could not cancel it. It may have already sent.");
    }
  }

  return (
    <section className="mb-8">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
          Going out
        </span>
        <span className="rounded-full bg-clay/10 px-2 py-0.5 text-[11px] font-bold text-clay-dark">
          {items.length} queued
        </span>
      </div>

      {dupKeys.size > 0 && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-gold/30 bg-gold/[0.08] px-4 py-2.5 text-[13px] text-[#8a6217]">
          <span aria-hidden>⚠️</span>
          <p>
            <strong>Looks like a duplicate.</strong> The same email is queued more
            than once. Cancel the extras below so families don&apos;t get it twice.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {items.map((it) => {
          const isDup = dupKeys.has(`${it.audience}::${it.subject.trim().toLowerCase()}`);
          const remaining = Math.max(0, it.expected - it.sentSoFar);
          const pct =
            it.expected > 0 ? Math.min(100, Math.round((it.sentSoFar / it.expected) * 100)) : 0;

          // A single, honest "when will this go" line. The worker overrides
          // everything: if it isn't running, nothing sends regardless of window.
          let statusNote: string;
          let warn = false;
          if (it.status === "sending") {
            statusNote =
              remaining > 0
                ? `Sending · ${it.sentSoFar} of ${it.expected} · next batch within the hour`
                : `Sending now · ${it.sentSoFar} of ${it.expected} sent`;
          } else if (it.expected === 0) {
            statusNote = "Will not send: no recipients match this audience/filters";
            warn = true;
          } else if (!it.dueNow) {
            statusNote = `Scheduled for ${formatDateTime(it.scheduledAt)}${
              workerHealthy ? "" : " (worker down, see above)"
            }`;
          } else if (!workerHealthy) {
            statusNote =
              "Waiting on the sending worker — it hasn't run recently, so nothing goes out until it's back (see the banner above)";
            warn = true;
          } else if (it.priority || it.audience === "families") {
            statusNote = "Expected: on the next worker run (within a few minutes)";
          } else if (!withinWindow) {
            statusNote = nextOpen
              ? `Expected: first batch at ${nextOpen} (quiet hours right now)`
              : "Expected: the next morning send window";
          } else {
            statusNote = `Expected: on the next worker run (within a few minutes), up to ${throttle}`;
          }

          return (
            <div
              key={it.id}
              className={`rounded-2xl border bg-white p-4 shadow-[0_1px_3px_rgba(7,20,23,0.04)] ${
                isDup ? "border-gold/50" : "border-line"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    href={`/admin/emails/${it.id}`}
                    className="block truncate text-[15px] font-semibold text-ink hover:text-clay-dark"
                  >
                    {it.subject || "(no subject)"}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-faint">
                    <span className="font-medium text-ink-soft">
                      {it.audience === "families" ? "Families" : "Leads"}
                    </span>
                    <span>·</span>
                    <span>
                      {it.expected} recipient{it.expected === 1 ? "" : "s"}
                      {it.isResend ? " (non-openers)" : ""}
                    </span>
                    {it.priority && (
                      <span className="rounded-full bg-clay/10 px-1.5 py-0.5 font-bold text-clay-dark">
                        Priority
                      </span>
                    )}
                    {isDup && (
                      <span className="rounded-full bg-gold/15 px-1.5 py-0.5 font-bold text-[#8a6217]">
                        Possible duplicate
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      it.status === "sending"
                        ? "bg-sage/15 text-sage"
                        : "bg-gold/15 text-[#8a6217]"
                    }`}
                  >
                    {it.status === "sending" ? "Sending" : "Scheduled"}
                  </span>
                  <ConfirmButton
                    variant="ghost"
                    size="sm"
                    title="Cancel this send?"
                    message="It's removed from the queue and won't go out. Anyone already sent to keeps their copy."
                    confirmLabel="Cancel send"
                    onConfirm={() => cancel(it.id)}
                  >
                    Cancel
                  </ConfirmButton>
                </div>
              </div>

              {it.expected > 0 && (
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-sage"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
              <p
                className={`mt-2 text-xs font-medium ${
                  warn ? "text-danger" : "text-ink-soft"
                }`}
              >
                {statusNote}
              </p>
              {it.status === "sending" && remaining > 0 && (
                <p className="mt-1 text-[11px] text-ink-faint">
                  {remaining} left · the rest send gradually to protect deliverability.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
