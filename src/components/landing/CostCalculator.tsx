"use client";

import { useEffect, useState } from "react";
import { COST_CALCULATOR } from "@/lib/landing";
import { track } from "@/lib/analytics";

const C = COST_CALCULATOR;

/** Hours per month a caregiver bills (24 * 30.4 / 24 = 30.4 days). */
const DAYS_PER_MONTH = 30.4;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/** Treat empty or non-numeric input as 0, never negative, no error state. */
function num(s: string): number {
  const v = parseFloat(s);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

/** Round to the nearest $50 and format "$8,550/mo". */
function money(n: number): string {
  const rounded = Math.round(n / 50) * 50;
  return `$${rounded.toLocaleString("en-US")}/mo`;
}

/** Fire once per browser session; also mirror to Plausible. */
function fireInteractionOnce() {
  try {
    if (sessionStorage.getItem("joy_calc_interaction")) return;
    sessionStorage.setItem("joy_calc_interaction", "1");
  } catch {
    /* private mode: fall through and still fire */
  }
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "calculator_interaction" });
  } catch {
    /* ignore */
  }
  track("calculator_interaction");
}

/**
 * The at-home cost calculator. Local state only, no server calls, nothing
 * stored or transmitted (analytics carry values, never PII). Both output cards
 * carry equal weight on purpose: some families come out cheaper at home, and
 * the tool has to survive that honestly.
 */
export default function CostCalculator() {
  const [paidHours, setPaidHours] = useState(C.defaults.paidHours);
  const [hourlyRate, setHourlyRate] = useState(String(C.defaults.hourlyRate));
  const [groceries, setGroceries] = useState(String(C.defaults.groceries));
  const [utilities, setUtilities] = useState(String(C.defaults.utilities));
  const [homeCosts, setHomeCosts] = useState(String(C.defaults.homeCosts));
  const [other, setOther] = useState(String(C.defaults.other));
  const [interacted, setInteracted] = useState(false);

  // Any change to a control counts as an interaction (fires the GTM event once).
  const onInteract = () => {
    setInteracted(true);
    fireInteractionOnce();
  };

  // Math (change set §Math).
  const monthlyCaregiver = paidHours * num(hourlyRate) * DAYS_PER_MONTH;
  const homeTotal =
    monthlyCaregiver +
    num(groceries) +
    num(utilities) +
    num(homeCosts) +
    num(other);
  const unpaidHours = (24 - paidHours) * 7;
  const joyRate = C.joyFrom;
  const homeRounded = Math.round(homeTotal / 50) * 50;

  // calculator_result_viewed: 3s after the last change, debounced. Each change
  // re-runs the effect, whose cleanup clears the pending timer, so only the
  // settled state fires. The closure captures this render's values.
  useEffect(() => {
    if (!interacted) return;
    const t = setTimeout(() => {
      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "calculator_result_viewed",
          home_total: homeRounded,
          care_type: "senior_living",
          paid_hours: paidHours,
        });
      } catch {
        /* ignore */
      }
      track("calculator_result_viewed", {
        home_total: String(homeRounded),
        care_type: "senior_living",
        paid_hours: String(paidHours),
      });
    }, 3000);
    return () => clearTimeout(t);
  }, [interacted, homeRounded, paidHours]);

  const hourLabel = `Paid help: ${paidHours} ${paidHours === 1 ? "hour" : "hours"} a day`;

  const conclusion =
    paidHours === 24
      ? "Round the clock coverage. Check the caregiver number again."
      : `That leaves ${unpaidHours} hours a week with nobody paid to be there.`;

  const numberField =
    "min-h-12 w-full rounded-lg border border-line bg-paper px-3 text-base text-ink focus:border-clay focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40";

  return (
    <section aria-label="At-home cost calculator" className="mx-auto max-w-5xl px-5 pb-16">
      <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
        <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          {C.heading}
        </h2>
        <p className="mt-2 max-w-[34em] text-lg leading-relaxed text-ink-soft">
          {C.subhead}
        </p>

        {/* Inputs */}
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-6">
          {/* Paid help slider (full width) */}
          <div className="flex w-full flex-col gap-2">
            <label htmlFor="calc-hours" className="text-base font-semibold text-ink">
              {hourLabel}
            </label>
            <input
              id="calc-hours"
              type="range"
              min={0}
              max={24}
              step={1}
              value={paidHours}
              onChange={(e) => {
                setPaidHours(Number(e.target.value));
                onInteract();
              }}
              aria-describedby="calc-hours-help"
              className="h-11 w-full accent-clay"
            />
            <p id="calc-hours-help" className="text-[0.95rem] text-ink-faint">
              {C.helpers.paidHelp}
            </p>
          </div>

          {/* Caregiver hourly rate */}
          <label className="flex min-w-60 flex-1 flex-col gap-2">
            <span className="text-base font-semibold text-ink">
              Caregiver hourly rate
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={15}
              max={60}
              value={hourlyRate}
              onChange={(e) => {
                setHourlyRate(e.target.value);
                onInteract();
              }}
              aria-describedby="calc-rate-help"
              className={numberField}
            />
            <span id="calc-rate-help" className="text-[0.95rem] text-ink-faint">
              {C.helpers.hourlyRate}
            </span>
          </label>

          {/* Groceries */}
          <label className="flex min-w-60 flex-1 flex-col gap-2">
            <span className="text-base font-semibold text-ink">
              Groceries and food, per month
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={groceries}
              onChange={(e) => {
                setGroceries(e.target.value);
                onInteract();
              }}
              className={numberField}
            />
          </label>

          {/* Utilities */}
          <label className="flex min-w-60 flex-1 flex-col gap-2">
            <span className="text-base font-semibold text-ink">
              Utilities, per month
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={utilities}
              onChange={(e) => {
                setUtilities(e.target.value);
                onInteract();
              }}
              className={numberField}
            />
          </label>

          {/* Insurance, tax, upkeep */}
          <label className="flex min-w-60 flex-1 flex-col gap-2">
            <span className="text-base font-semibold text-ink">
              Insurance, property tax, upkeep, per month
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={homeCosts}
              onChange={(e) => {
                setHomeCosts(e.target.value);
                onInteract();
              }}
              className={numberField}
            />
          </label>

          {/* Everything else */}
          <label className="flex min-w-60 flex-1 flex-col gap-2">
            <span className="text-base font-semibold text-ink">
              Everything else, per month
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={other}
              onChange={(e) => {
                setOther(e.target.value);
                onInteract();
              }}
              aria-describedby="calc-other-help"
              className={numberField}
            />
            <span id="calc-other-help" className="text-[0.95rem] text-ink-faint">
              {C.helpers.other}
            </span>
          </label>
        </div>

        {/* Outputs */}
        <div className="mt-8 flex flex-wrap gap-4 border-t border-line pt-8">
          <div className="min-w-48 flex-1 rounded-xl border border-line bg-paper p-5">
            <p className="text-base font-semibold text-ink-soft">Staying home</p>
            <p className="mt-1 whitespace-nowrap font-display text-4xl font-semibold text-ink">
              {money(homeTotal)}
            </p>
          </div>
          <div className="min-w-48 flex-1 rounded-xl border border-clay/25 bg-clay/[0.06] p-5">
            <p className="text-base font-semibold text-clay-dark">Joy starts at</p>
            <p className="mt-1 whitespace-nowrap font-display text-4xl font-semibold text-ink">
              {money(joyRate)}
            </p>
            <p className="mt-1 text-sm text-ink-soft">{C.joyLabel}</p>
          </div>
        </div>

        <p className="mt-6 max-w-[30em] border-l-[3px] border-clay pl-4 font-display text-xl leading-snug text-ink text-pretty">
          {conclusion}
        </p>

        <p className="mt-6 max-w-[34em] text-[0.98rem] leading-relaxed text-ink-soft">
          {C.disclaimer}
        </p>
      </div>
    </section>
  );
}
