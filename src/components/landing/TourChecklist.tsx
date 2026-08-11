"use client";

import { useEffect, useState } from "react";
import { CHECKLIST_GROUPS } from "@/lib/landing";

const STORAGE_KEY = "joy-tour-checklist";
const TOTAL = CHECKLIST_GROUPS.reduce((n, g) => n + g.items.length, 0);

/**
 * The 25-question tour checklist. Tappable rows keep a `checked` map that
 * persists to localStorage, so her marks survive walking into a building and
 * closing the tab. A Print button calls window.print(); the page's print
 * stylesheet shows only this block (#tour-checklist).
 */
export default function TourChecklist() {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  // Load once on mount. Reading localStorage must happen after hydration (the
  // server can't know it), so setting state here is intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist after load (never overwrite storage with the empty initial state).
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {
      /* ignore */
    }
  }, [checked, loaded]);

  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div id="tour-checklist">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          The 25 questions
        </h2>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-surface print:hidden"
        >
          Print this page
        </button>
      </div>
      <p className="mt-2 text-ink-soft print:hidden">
        {done ? `${done} of ${TOTAL} checked` : `${TOTAL} questions in five groups`}{" "}
        · tap one to check it off on your phone.
      </p>

      {CHECKLIST_GROUPS.map((group, gi) => {
        // Flat 0..24 index = items in all earlier groups + position here.
        const start = CHECKLIST_GROUPS.slice(0, gi).reduce(
          (n, g) => n + g.items.length,
          0
        );
        return (
        <div key={group.name} className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
            {group.name}
          </p>
          <div className="mt-2 border-t border-line">
            {group.items.map((item, ii) => {
              const i = start + ii;
              const on = !!checked[i];
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setChecked((c) => ({ ...c, [i]: !c[i] }))
                  }
                  className="flex w-full items-start gap-3 border-b border-line py-4 text-left"
                >
                  <span
                    aria-hidden
                    className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded border text-sm ${
                      on
                        ? "border-clay bg-clay text-white"
                        : "border-clay text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-ink">{item.q}</span>
                    <span className="text-sm text-ink-faint">{item.why}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        );
      })}
    </div>
  );
}
