import type { BadgeTone } from "@/components/admin/ui";

/**
 * Partners CRM vocabulary: statuses, tiers, owners, categories, activity types,
 * and outcome enums, with their labels and pill tones. Pure constants only (no
 * DB, no JSX) so BOTH the server pages and the client slide-overs / import panel
 * can import the same source of truth. lib/partners.ts (which imports pg) re-uses
 * these types; never import lib/partners.ts from a client component.
 */

/* ---- Status ---- */
export const PARTNER_STATUSES = [
  "research",
  "not_contacted",
  "attempted",
  "connected",
  "materials_sent",
  "tour_scheduled",
  "active_partner",
  "nurture",
  "closed",
] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

export const STATUS_LABEL: Record<PartnerStatus, string> = {
  research: "Research",
  not_contacted: "Not contacted",
  attempted: "Attempted",
  connected: "Connected",
  materials_sent: "Materials sent",
  tour_scheduled: "Tour scheduled",
  active_partner: "Active partner",
  nurture: "Nurture",
  closed: "Closed",
};

// Pill tone per status (README status -> tone mapping). Not-contacted is an
// outline style and Active-partner is a solid fill; both are handled in
// <StatusPill> rather than the plain Badge tone set.
export const STATUS_TONE: Record<PartnerStatus, BadgeTone> = {
  research: "neutral",
  not_contacted: "neutral",
  attempted: "warning",
  connected: "info",
  materials_sent: "violet",
  tour_scheduled: "success",
  active_partner: "success",
  nurture: "slate",
  closed: "neutral",
};

// Pipeline rank for "progressed past Attempted" stats. Nurture/closed are
// side-states (rank -1), not steps forward.
export const STATUS_RANK: Record<PartnerStatus, number> = {
  research: 0,
  not_contacted: 1,
  attempted: 2,
  connected: 3,
  materials_sent: 4,
  tour_scheduled: 5,
  active_partner: 6,
  nurture: -1,
  closed: -1,
};

/* ---- Tier / owner ---- */
export type PartnerTier = "A" | "B" | "C";
export const PARTNER_TIERS: PartnerTier[] = ["A", "B", "C"];

export type PartnerOwner = "adam" | "mellissa" | "both";
export const PARTNER_OWNERS: PartnerOwner[] = ["adam", "mellissa", "both"];
export const OWNER_LABEL: Record<PartnerOwner, string> = {
  adam: "Adam",
  mellissa: "Mellissa",
  both: "Both",
};

/* ---- Category ---- */
export const PARTNER_CATEGORIES = [
  { value: "hospital", label: "Hospital" },
  { value: "hospice", label: "Hospice" },
  { value: "home_health", label: "Home health" },
  { value: "snf", label: "SNF / rehab" },
  { value: "placement", label: "Placement agency" },
  { value: "faith", label: "Faith community" },
  { value: "pcp", label: "Primary care / PCP" },
  { value: "other", label: "Other" },
] as const;
export type PartnerCategory = (typeof PARTNER_CATEGORIES)[number]["value"];
export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  PARTNER_CATEGORIES.map((c) => [c.value, c.label])
);
/** Map a free-text category (e.g. from CSV) to a known key, else "other". */
export function normalizeCategory(raw: string | null | undefined): PartnerCategory {
  const s = (raw || "").trim().toLowerCase();
  if (!s) return "other";
  const direct = PARTNER_CATEGORIES.find((c) => c.value === s);
  if (direct) return direct.value;
  if (/hosp(ital)?/.test(s)) return "hospital";
  if (/hospice/.test(s)) return "hospice";
  if (/home\s*health|hha/.test(s)) return "home_health";
  if (/snf|skilled|rehab|nursing/.test(s)) return "snf";
  if (/placement|advisor|agency|a place for mom|caring\.com/.test(s)) return "placement";
  if (/church|faith|ministry|temple|synagogue/.test(s)) return "faith";
  if (/pcp|physician|primary|doctor|clinic|md\b/.test(s)) return "pcp";
  return "other";
}

/* ---- Activity types ---- */
export const ACTIVITY_TYPES = [
  "call",
  "email",
  "text",
  "visit",
  "tour",
  "materials",
  "other",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  call: "Call",
  email: "Email",
  text: "Text",
  visit: "Visit",
  tour: "Tour",
  materials: "Materials",
  other: "Other",
};
// 3-4 letter timeline glyph label.
export const ACTIVITY_CODE: Record<ActivityType, string> = {
  call: "CALL",
  email: "MAIL",
  text: "TEXT",
  visit: "VISIT",
  tour: "TOUR",
  materials: "MTRL",
  other: "NOTE",
};

/* ---- Call outcome ---- */
export const CALL_OUTCOMES = ["connected", "voicemail", "no_answer", "busy"] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];
export const CALL_OUTCOME_LABEL: Record<CallOutcome, string> = {
  connected: "Connected",
  voicemail: "Voicemail",
  no_answer: "No answer",
  busy: "Busy",
};

/* ---- Referral outcome ---- */
export const REFERRAL_OUTCOMES = ["inquiry", "tour", "admitted", "not_a_fit"] as const;
export type ReferralOutcome = (typeof REFERRAL_OUTCOMES)[number];
export const REFERRAL_OUTCOME_LABEL: Record<ReferralOutcome, string> = {
  inquiry: "Inquiry",
  tour: "Tour",
  admitted: "Admitted",
  not_a_fit: "Not a fit",
};
export const REFERRAL_OUTCOME_TONE: Record<ReferralOutcome, BadgeTone> = {
  inquiry: "info",
  tour: "warning",
  admitted: "success",
  not_a_fit: "neutral",
};

/* ---- Date helpers (client + server safe) ---- */

/** True when a next_date (YYYY-MM-DD) falls on or before the end of this week. */
export function isDueThisWeek(next_date: string | null): boolean {
  if (!next_date) return false;
  const d = new Date(next_date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 0 = Monday
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + (6 - day));
  sunday.setHours(23, 59, 59, 999);
  return d.getTime() <= sunday.getTime();
}

/** True when a next_date is strictly before today (overdue). */
export function isOverdue(next_date: string | null): boolean {
  if (!next_date) return false;
  const d = new Date(next_date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

/** "Mon, Sep 15" style short date with weekday, or "" for empty. */
export function formatWeekdayShort(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value.length <= 10 ? value + "T00:00:00" : value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
