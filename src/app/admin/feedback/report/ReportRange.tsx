"use client";

import { useRouter, useSearchParams } from "next/navigation";

const PRESETS: { value: string; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
  { value: "ytd", label: "Year to date" },
];

/**
 * Period picker for the report. A round (the month a survey went out), a
 * preset, or a custom date range writes to the URL query, so the server
 * re-renders the report (and print reflects it). Hidden when printing.
 */
export default function ReportRange({
  preset,
  round,
  rounds,
  from,
  to,
}: {
  preset: string;
  round: string | null;
  rounds: { value: string; label: string }[];
  from: string;
  to: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function setPreset(value: string) {
    const next = new URLSearchParams(params.toString());
    next.set("preset", value);
    next.delete("round");
    if (value !== "custom") {
      next.delete("from");
      next.delete("to");
    }
    router.push(`/admin/feedback/report?${next.toString()}`);
  }

  function setRound(value: string) {
    const next = new URLSearchParams();
    next.set("preset", "round");
    next.set("round", value);
    router.push(`/admin/feedback/report?${next.toString()}`);
  }

  function setCustom(key: "from" | "to", value: string) {
    const next = new URLSearchParams(params.toString());
    next.set("preset", "custom");
    next.delete("round");
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/admin/feedback/report?${next.toString()}`);
  }

  return (
    <div className="print:hidden">
      {rounds.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-sm text-ink-soft">Round:</span>
          {rounds.map((r) => {
            const active = preset === "round" && round === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setRound(r.value)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  active
                    ? "bg-clay text-white"
                    : "border border-line text-ink-soft hover:bg-surface"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => {
          const active = preset === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => setPreset(p.value)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                active
                  ? "bg-clay text-white"
                  : "border border-line text-ink-soft hover:bg-surface"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <span>Custom:</span>
        <input
          type="date"
          value={from}
          onChange={(e) => setCustom("from", e.target.value)}
          className="rounded-lg border border-line px-2 py-1 text-sm"
          aria-label="From date"
        />
        <span>to</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setCustom("to", e.target.value)}
          className="rounded-lg border border-line px-2 py-1 text-sm"
          aria-label="To date"
        />
      </div>
    </div>
  );
}
