import { Badge } from "./ui";
import {
  STATUS_LABEL,
  STATUS_TONE,
  REFERRAL_OUTCOME_LABEL,
  REFERRAL_OUTCOME_TONE,
  type PartnerStatus,
  type PartnerTier,
  type ReferralOutcome,
} from "@/lib/partners-vocab";

/**
 * Partners CRM pill/badge set. Server-safe (no hooks), reused on the list, the
 * detail page, and inside the client slide-overs. Two statuses render outside
 * the plain Badge tone set: "Not contacted" is an outline pill and
 * "Active partner" is the one solid fill (the pipeline end-state).
 */
export function StatusPill({ status }: { status: PartnerStatus }) {
  if (status === "not_contacted") {
    return (
      <span className="inline-flex items-center rounded-full border border-line bg-white px-2.5 py-0.5 text-xs font-medium text-ink">
        {STATUS_LABEL.not_contacted}
      </span>
    );
  }
  if (status === "active_partner") {
    return (
      <span className="inline-flex items-center rounded-full bg-sage px-2.5 py-0.5 text-xs font-medium text-white">
        {STATUS_LABEL.active_partner}
      </span>
    );
  }
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}

/** 24px rounded-square tier chip. Tier A is highlighted; B/C are quiet. */
export function TierBadge({ tier }: { tier: PartnerTier | null }) {
  if (!tier) {
    return <span className="text-ink-faint">—</span>;
  }
  const highlight = tier === "A";
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
        highlight ? "bg-clay/12 text-clay-dark" : "bg-surface text-ink"
      }`}
      title={`Tier ${tier}`}
    >
      {tier}
    </span>
  );
}

export function ReferralOutcomePill({ outcome }: { outcome: ReferralOutcome }) {
  return (
    <Badge tone={REFERRAL_OUTCOME_TONE[outcome]}>
      {REFERRAL_OUTCOME_LABEL[outcome]}
    </Badge>
  );
}
