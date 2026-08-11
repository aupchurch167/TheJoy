import { TESTIMONIALS } from "./site";

/**
 * Content for the conversion landing pages (/cost, /reviews, and the rest as
 * they are built). Kept here (not in components) so the copy and the numbers
 * are editable in one place, per the project rule. Voice (§2) and compliance
 * (§4) apply: no em-dashes (parentheses for asides), no banned words, Joy is a
 * personal care home (never "assisted living" as its own label).
 */

/* ----------------------------- /cost ----------------------------- */

/**
 * Owner-set rates (supplied for the /cost page). Publishing the number is the
 * whole point of the page. The memory-care tier only shows when memory care is
 * offered (MEMORY_CARE.enabled).
 */
export const RATES: {
  key: string;
  label: string;
  amount: string;
  unit: string;
  requiresMemoryCare?: boolean;
}[] = [
  { key: "personal", label: "Personal Care", amount: "$4,500", unit: "from, per month" },
  {
    key: "memory",
    label: "Memory Care",
    amount: "$5,500",
    unit: "from, per month",
    requiresMemoryCare: true,
  },
  { key: "respite", label: "Respite", amount: "$250", unit: "up to, per day" },
];

export const RATES_NOTE =
  "Your exact rate depends on the care your parent needs. Mellissa sets it after meeting them (not before).";

/** The "what the number replaces" ledger: two facing cards. */
export const COST_LEDGER = {
  intro:
    "Nobody compares one rate to nothing. She compares it to what she is already paying, in money and in Tuesdays.",
  home: {
    label: "Staying home",
    rows: [
      { item: "24/7 home care", value: "$15–25K/mo" },
      { item: "Groceries, cooking", value: "on you" },
      { item: "Utilities, upkeep, taxes", value: "on you" },
      { item: "Medication management", value: "on you" },
      { item: "Your unpaid 2am shifts", value: "every night" },
    ],
    close: "Two of those you can invoice. The rest you pay in sleep.",
  },
  joy: {
    label: "One rate at Joy",
    rows: [
      { item: "Her room", value: "included" },
      { item: "Three cooked meals, every day, holidays too", value: "included" },
      { item: "Bathing, dressing, medications on time", value: "included" },
      { item: "Housekeeping and laundry", value: "included" },
      { item: "Someone awake all night", value: "included" },
    ],
    close:
      "One number. One check. Nobody to schedule at 6am when an aide calls out.",
  },
};

export const COST_FAQ: { title: string; body: string }[] = [
  {
    title: "What's included in the rate?",
    body: "Her room, three meals cooked here every day, help with bathing and dressing, medications given on time, housekeeping, laundry, and staff awake and on-site all night. Not included: her personal doctor visits, prescriptions themselves, and anything she'd buy for herself anyway.",
  },
  {
    title: "When do rates change?",
    body: "Once a year, and we tell you in writing well before it happens. A rate can also change if your parent's care needs change (Mellissa will talk to you first, not send a new invoice and hope you notice).",
  },
  {
    title: "Does insurance or Medicaid pay for this?",
    body: "Medicare does not pay for personal care homes. Long-term care insurance and VA Aid & Attendance often do, in part. Call and we'll tell you honestly what we've seen work for other families.",
  },
  {
    title: "Is there a deposit?",
    body: "Yes, one month's rate, applied to the first month. There is no community fee, no entrance fee, and no buy-in.",
  },
];

export const COST_VALUE_QUOTE = {
  quote:
    "We were paying more than this for aides who kept changing. The first month here I slept through the night.",
  who: "Karen, daughter of a resident",
};

/* ---------------------------- /reviews --------------------------- */

/** The resident's own line opens the wall; no marketing sentence beats it. */
const REVIEW_OPENING = {
  quote: "I like my new home.",
  who: "What Mike's father said, unprompted, over coffee in his room.",
};

/**
 * The quote wall = the resident's line, then the real family reviews from the
 * homepage (single source: TESTIMONIALS in site.ts). `align` alternates for
 * rhythm on the page.
 */
export function reviewQuotes(): { quote: string; who: string; align: "start" | "end" }[] {
  const rest = TESTIMONIALS.map((t) => ({
    quote: t.quote,
    who: t.context ? `${t.name}, ${t.context.toLowerCase()}` : t.name,
  }));
  return [REVIEW_OPENING, ...rest].map((q, i) => ({
    ...q,
    align: i % 2 ? "end" : "start",
  }));
}

/** Star ratings shown as chips on /reviews (counts intentionally omitted). */
export const REVIEW_BADGES: { label: string; value: string }[] = [
  { label: "A Place for Mom", value: "Best of Senior Living" },
  { label: "Google", value: "4.9" },
  { label: "Caring.com", value: "5.0" },
];

/**
 * Where families can read the reviews in full. TODO(owner): replace with the
 * exact Google / A Place for Mom / Caring.com profile URLs. The Google link is
 * a live search for the business until the real profile URL is pasted in.
 */
export const REVIEW_LINKS: { label: string; href: string }[] = [
  {
    label: "Google reviews",
    href: "https://www.google.com/search?q=Joy+Senior+Living+Loganville+GA+reviews",
  },
  { label: "A Place for Mom profile", href: "https://www.aplaceformom.com/" },
  { label: "Caring.com profile", href: "https://www.caring.com/" },
];
