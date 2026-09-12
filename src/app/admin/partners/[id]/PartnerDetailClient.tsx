"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Button,
  Card,
  SectionLabel,
  Input,
  Textarea,
  Select,
  Badge,
} from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { useToast } from "@/components/admin/Toast";
import {
  StatusPill,
  TierBadge,
  ReferralOutcomePill,
} from "@/components/admin/PartnerBadges";
import { orDash } from "@/lib/format";
import {
  ACTIVITY_TYPES,
  ACTIVITY_LABEL,
  ACTIVITY_CODE,
  CALL_OUTCOMES,
  CALL_OUTCOME_LABEL,
  PARTNER_STATUSES,
  PARTNER_OWNERS,
  REFERRAL_OUTCOMES,
  STATUS_LABEL,
  OWNER_LABEL,
  CATEGORY_LABEL,
  REFERRAL_OUTCOME_LABEL,
  isDueThisWeek,
  isOverdue,
  formatWeekdayShort,
  type ActivityType,
  type PartnerOwner,
  type ReferralOutcome,
} from "@/lib/partners-vocab";
import type {
  Partner,
  PartnerActivity,
  PartnerReminder,
  PartnerReferral,
} from "@/lib/partners";
import PartnerFormSlideOver from "../PartnerFormSlideOver";
import EmailComposerButton from "../EmailComposerButton";
import {
  logTouch,
  patchPartnerField,
  markClosed,
  addReminderAction,
  toggleReminderAction,
  deleteReminderAction,
  addReferralAction,
} from "../actions";

// Pure href helpers (inlined so this client module never pulls @/lib/settings,
// which imports the DB).
const toTelHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
const toMailHref = (email: string) => `mailto:${email}`;

function dateTime(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function daysAgoLabel(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.round((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function PartnerDetailClient({
  partner,
  activities,
  reminders,
  referrals,
  currentUser,
  backHref,
  prevHref,
  nextHref,
  position,
  total,
}: {
  partner: Partner;
  activities: PartnerActivity[];
  reminders: PartnerReminder[];
  referrals: PartnerReferral[];
  currentUser: string;
  backHref: string;
  prevHref: string | null;
  nextHref: string | null;
  position: number | null;
  total: number;
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  return (
    <div>
      {/* Top row: back + pager */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-clay hover:text-clay-dark"
        >
          <span aria-hidden>←</span> Back to partners
        </Link>
        {position && total > 1 && (
          <div className="flex items-center gap-2 text-sm text-ink-faint">
            <span>
              Partner {position} of {total}
            </span>
            <PagerButton href={prevHref} label="Previous partner">
              ←
            </PagerButton>
            <PagerButton href={nextHref} label="Next partner">
              →
            </PagerButton>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-3xl font-semibold text-ink">
              {partner.organization}
            </h1>
            <StatusPill status={partner.status} />
            <TierBadge tier={partner.tier} />
          </div>
          <p className="mt-1.5 text-sm text-ink-soft">
            {CATEGORY_LABEL[partner.category] ?? partner.category}
            {partner.contact_name && (
              <>
                {" · "}
                {partner.contact_name}
                {partner.contact_role ? `, ${partner.contact_role}` : ""}
              </>
            )}
            {partner.phone && (
              <>
                {" · "}
                <a
                  href={toTelHref(partner.phone)}
                  className="text-clay hover:text-clay-dark"
                >
                  {partner.phone}
                </a>
              </>
            )}
            {partner.email && (
              <>
                {" · "}
                <a
                  href={toMailHref(partner.email)}
                  className="text-clay hover:text-clay-dark"
                >
                  {partner.email}
                </a>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {partner.phone && (
            <a
              href={toTelHref(partner.phone)}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink hover:bg-surface"
            >
              Call
            </a>
          )}
          <EmailComposerButton partner={partner} />
          <PartnerFormSlideOver mode="edit" partner={partner} triggerLabel="Edit" />
        </div>
      </div>

      {/* Body: two columns */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <LogActivityCard
            partner={partner}
            currentUser={currentUser}
            onSaved={(msg) => {
              success(msg);
              router.refresh();
            }}
            onError={toastError}
          />
          <NotesCard
            partnerId={partner.id}
            notes={partner.notes}
            onDone={() => router.refresh()}
            onError={toastError}
            onSuccess={success}
          />
          <RemindersCard
            partnerId={partner.id}
            reminders={reminders}
            onDone={() => router.refresh()}
            onError={toastError}
            onSuccess={success}
          />
          <TimelineCard activities={activities} />
          <ReferralsCard
            partnerId={partner.id}
            referrals={referrals}
            onDone={() => router.refresh()}
            onError={toastError}
            onSuccess={success}
          />
        </div>

        <DetailSidebar
          partner={partner}
          onDone={() => router.refresh()}
          onError={toastError}
          onSuccess={success}
        />
      </div>
    </div>
  );
}

function PagerButton({
  href,
  label,
  children,
}: {
  href: string | null;
  label: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-faint opacity-40">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-surface hover:text-ink"
    >
      {children}
    </Link>
  );
}

/* ---------------- Log activity ---------------- */

function LogActivityCard({
  partner,
  currentUser,
  onSaved,
  onError,
}: {
  partner: Partner;
  currentUser: string;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [type, setType] = useState<ActivityType>("call");
  const [note, setNote] = useState("");
  const [callOutcome, setCallOutcome] = useState("");
  const [callDuration, setCallDuration] = useState("");
  const [statusOverride, setStatusOverride] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const res = await logTouch({
        partnerId: partner.id,
        type,
        note,
        callOutcome: type === "call" ? callOutcome : "",
        callDuration: type === "call" ? callDuration : "",
        status: statusOverride,
        nextAction,
        nextDate,
      });
      if (!res.ok) {
        onError(res.error);
        return;
      }
      setNote("");
      setCallOutcome("");
      setCallDuration("");
      setStatusOverride("");
      setNextAction("");
      setNextDate("");
      onSaved(res.toast);
    });
  }

  return (
    <div
      id="log"
      className="rounded-xl border-[1.5px] border-clay bg-white p-6 shadow-[0_0_0_3px_rgba(1,167,206,0.1)]"
    >
      <div className="flex items-center justify-between">
        <SectionLabel>Log activity</SectionLabel>
        <span className="text-xs text-ink-faint">
          Logged as {currentUser} · today
        </span>
      </div>

      {/* Type chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {ACTIVITY_TYPES.map((t) => {
          const on = type === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`h-9 rounded-full px-3.5 text-sm font-semibold transition-colors ${
                on
                  ? "bg-ink text-white"
                  : "border border-line bg-white text-ink-soft hover:bg-surface"
              }`}
            >
              {ACTIVITY_LABEL[t]}
            </button>
          );
        })}
      </div>

      {/* Note */}
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            save();
          }
        }}
        placeholder="What happened? One line is plenty."
        className="mt-4 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-faint focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30"
      />

      {/* Call sub-row */}
      {type === "call" && (
        <div className="mt-3 flex flex-wrap gap-3 rounded-lg bg-surface p-3">
          <select
            value={callOutcome}
            onChange={(e) => setCallOutcome(e.target.value)}
            className="h-10 rounded-lg border border-line bg-white px-2 text-sm text-ink"
          >
            <option value="">Outcome…</option>
            {CALL_OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {CALL_OUTCOME_LABEL[o]}
              </option>
            ))}
          </select>
          <input
            value={callDuration}
            onChange={(e) => setCallDuration(e.target.value)}
            placeholder="Duration, e.g. 4 min"
            className="h-10 flex-1 rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-faint"
          />
        </div>
      )}

      {/* Status + next step */}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-faint">
            Update status to
          </label>
          <Select
            value={statusOverride}
            onChange={(e) => setStatusOverride(e.target.value)}
          >
            <option value="">Keep {STATUS_LABEL[partner.status]}</option>
            {PARTNER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-faint">
            Next action
          </label>
          <Input
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="e.g. Send packet"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-faint">
            Next date
          </label>
          <Input
            type="date"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save touch"}
        </Button>
        <span className="text-xs text-ink-faint">
          Enter saves. Status and next step are optional.
        </span>
      </div>
    </div>
  );
}

/* ---------------- Notes ---------------- */

function NotesCard({
  partnerId,
  notes,
  onDone,
  onError,
  onSuccess,
}: {
  partnerId: string;
  notes: string | null;
  onDone: () => void;
  onError: (m: string) => void;
  onSuccess: (m: string) => void;
}) {
  const [value, setValue] = useState(notes ?? "");
  const [pending, start] = useTransition();
  const dirty = value !== (notes ?? "");

  function save() {
    start(async () => {
      const res = await patchPartnerField({ id: partnerId, notes: value });
      if (!res.ok) {
        onError(res.error);
        return;
      }
      onSuccess("Notes saved.");
      onDone();
    });
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionLabel>Notes</SectionLabel>
        <Button size="sm" onClick={save} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save notes"}
        </Button>
      </div>
      <Textarea
        rows={6}
        className="mt-3"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Context worth keeping: who to ask for, what they care about, how past conversations went."
      />
    </Card>
  );
}

/* ---------------- Reminders ---------------- */

function RemindersCard({
  partnerId,
  reminders,
  onDone,
  onError,
  onSuccess,
}: {
  partnerId: string;
  reminders: PartnerReminder[];
  onDone: () => void;
  onError: (m: string) => void;
  onSuccess: (m: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [pending, start] = useTransition();

  function add() {
    if (!label.trim()) {
      onError("Add a short label.");
      return;
    }
    start(async () => {
      const res = await addReminderAction({ partnerId, label, dueDate });
      if (!res.ok) {
        onError(res.error);
        return;
      }
      setLabel("");
      setDueDate("");
      setAdding(false);
      onSuccess("Reminder added.");
      onDone();
    });
  }

  function toggle(id: string, done: boolean) {
    start(async () => {
      const res = await toggleReminderAction(id, done, partnerId);
      if (!res.ok) onError(res.error);
      else onDone();
    });
  }

  function remove(id: string) {
    start(async () => {
      const res = await deleteReminderAction(id, partnerId);
      if (!res.ok) onError(res.error);
      else onDone();
    });
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionLabel>Reminders</SectionLabel>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="text-sm font-semibold text-clay hover:text-clay-dark"
        >
          + Add reminder
        </button>
      </div>

      {adding && (
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Remind me to…"
            className="h-10 flex-1 rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-faint"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-10 rounded-lg border border-line bg-white px-2 text-sm text-ink"
          />
          <Button size="sm" onClick={add} disabled={pending}>
            Add
          </Button>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {reminders.length === 0 ? (
          <p className="text-sm text-ink-faint">No reminders yet.</p>
        ) : (
          reminders.map((r) => {
            const upcoming = !r.done && isDueThisWeek(r.due_date);
            return (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={r.done}
                  onChange={(e) => toggle(r.id, e.target.checked)}
                  className="h-4 w-4 accent-clay"
                />
                <span
                  className={`flex-1 text-sm ${
                    r.done ? "text-ink-faint line-through opacity-60" : "text-ink"
                  }`}
                >
                  {r.label}
                </span>
                {r.due_date && (
                  <span
                    className={`text-xs ${
                      r.done
                        ? "text-ink-faint"
                        : upcoming
                          ? "font-semibold text-[#8a6217]"
                          : "text-ink-soft"
                    }`}
                  >
                    {formatWeekdayShort(r.due_date)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  className="text-ink-faint hover:text-danger"
                  aria-label="Remove reminder"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Reminders are personal nudges and don&rsquo;t change the partner&rsquo;s
        next action.
      </p>
    </Card>
  );
}

/* ---------------- Timeline ---------------- */

function TimelineCard({ activities }: { activities: PartnerActivity[] }) {
  return (
    <Card>
      <SectionLabel>Timeline</SectionLabel>
      {activities.length === 0 ? (
        <p className="mt-3 text-sm text-ink-faint">
          No touches logged yet. Log the first one above.
        </p>
      ) : (
        <ol className="mt-4 space-y-4">
          {activities.map((a, i) => {
            const meta = [
              dateTime(a.logged_at),
              i === 0 ? daysAgoLabel(a.logged_at) : "",
              a.type === "call" && (a.call_duration || a.call_outcome)
                ? [
                    a.call_duration,
                    a.call_outcome
                      ? CALL_OUTCOME_LABEL[a.call_outcome]
                      : "",
                  ]
                    .filter(Boolean)
                    .join(", ")
                : "",
              a.logged_by || "",
            ].filter(Boolean);
            return (
              <li key={a.id} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-[10px] font-bold text-ink-soft">
                  {ACTIVITY_CODE[a.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">
                    {a.note || ACTIVITY_LABEL[a.type]}
                    {a.status_change && (
                      <Badge tone="info" className="ml-2">
                        → {STATUS_LABEL[a.status_change]}
                      </Badge>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {meta.join(" · ")}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

/* ---------------- Referrals ---------------- */

function ReferralsCard({
  partnerId,
  referrals,
  onDone,
  onError,
  onSuccess,
}: {
  partnerId: string;
  referrals: PartnerReferral[];
  onDone: () => void;
  onError: (m: string) => void;
  onSuccess: (m: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [occurredOn, setOccurredOn] = useState("");
  const [familyLabel, setFamilyLabel] = useState("");
  const [outcome, setOutcome] = useState<ReferralOutcome>("inquiry");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();

  function add() {
    start(async () => {
      const res = await addReferralAction({
        partnerId,
        occurredOn,
        familyLabel,
        outcome,
        notes,
      });
      if (!res.ok) {
        onError(res.error);
        return;
      }
      setOccurredOn("");
      setFamilyLabel("");
      setOutcome("inquiry");
      setNotes("");
      setAdding(false);
      onSuccess("Referral added.");
      onDone();
    });
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionLabel>Referrals</SectionLabel>
        <Button variant="secondary" size="sm" onClick={() => setAdding((v) => !v)}>
          Add referral
        </Button>
      </div>

      {adding && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            type="date"
            value={occurredOn}
            onChange={(e) => setOccurredOn(e.target.value)}
            className="h-10 rounded-lg border border-line bg-white px-2 text-sm text-ink"
          />
          <input
            value={familyLabel}
            onChange={(e) => setFamilyLabel(e.target.value)}
            placeholder="Family (initials only)"
            className="h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-faint"
          />
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as ReferralOutcome)}
            className="h-10 rounded-lg border border-line bg-white px-2 text-sm text-ink"
          >
            {REFERRAL_OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {REFERRAL_OUTCOME_LABEL[o]}
              </option>
            ))}
          </select>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            className="h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-faint"
          />
          <div className="sm:col-span-2">
            <Button size="sm" onClick={add} disabled={pending}>
              {pending ? "Saving…" : "Save referral"}
            </Button>
          </div>
        </div>
      )}

      {referrals.length === 0 ? (
        <p className="mt-3 text-sm text-ink-faint">No referrals logged yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 pr-3 font-semibold">Family</th>
                <th className="py-2 pr-3 font-semibold">Outcome</th>
                <th className="py-2 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {referrals.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap py-2 pr-3 text-ink-soft">
                    {formatWeekdayShort(r.occurred_on)}
                  </td>
                  <td className="py-2 pr-3 text-ink">{orDash(r.family_label)}</td>
                  <td className="py-2 pr-3">
                    <ReferralOutcomePill outcome={r.outcome} />
                  </td>
                  <td className="py-2 text-ink-soft">{orDash(r.notes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ---------------- Sidebar ---------------- */

function DetailSidebar({
  partner,
  onDone,
  onError,
  onSuccess,
}: {
  partner: Partner;
  onDone: () => void;
  onError: (m: string) => void;
  onSuccess: (m: string) => void;
}) {
  const [pending, start] = useTransition();
  const [editingNext, setEditingNext] = useState(false);
  const [nextAction, setNextAction] = useState(partner.next_action ?? "");
  const [nextDate, setNextDate] = useState(
    partner.next_date ? partner.next_date.slice(0, 10) : ""
  );

  function patch(fields: Record<string, unknown>, msg: string, after?: () => void) {
    start(async () => {
      const res = await patchPartnerField({ id: partner.id, ...fields });
      if (!res.ok) {
        onError(res.error);
        return;
      }
      onSuccess(msg);
      after?.();
      onDone();
    });
  }

  const nextOverdue = isOverdue(partner.next_date);
  const nextDue = isDueThisWeek(partner.next_date);

  return (
    <div className="space-y-4">
      <Card>
        <SectionLabel>Details</SectionLabel>
        <div className="mt-4 space-y-4 text-sm">
          {/* Owner */}
          <div>
            <p className="mb-1 text-xs text-ink-faint">Owner</p>
            <Select
              value={partner.owner}
              onChange={(e) =>
                patch({ owner: e.target.value as PartnerOwner }, "Owner updated.")
              }
              disabled={pending}
            >
              {PARTNER_OWNERS.map((o) => (
                <option key={o} value={o}>
                  {OWNER_LABEL[o]}
                </option>
              ))}
            </Select>
          </div>

          {/* Next step */}
          <div className="border-t border-line pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-faint">Next action</p>
              <button
                type="button"
                onClick={() => setEditingNext((v) => !v)}
                className="text-xs font-semibold text-clay hover:text-clay-dark"
              >
                {editingNext ? "Cancel" : "Edit"}
              </button>
            </div>
            {editingNext ? (
              <div className="mt-2 space-y-2">
                <Input
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="Next action"
                />
                <Input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                />
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    patch(
                      { next_action: nextAction, next_date: nextDate },
                      "Next step saved.",
                      () => setEditingNext(false)
                    )
                  }
                >
                  Save
                </Button>
              </div>
            ) : (
              <div className="mt-1">
                <p className="font-medium text-ink">
                  {orDash(partner.next_action)}
                </p>
                {partner.next_date && (
                  <p
                    className={`text-xs ${
                      nextOverdue
                        ? "font-semibold text-danger"
                        : nextDue
                          ? "font-semibold text-[#8a6217]"
                          : "text-ink-soft"
                    }`}
                  >
                    {formatWeekdayShort(partner.next_date)}
                    {nextOverdue ? " (overdue)" : ""}
                  </p>
                )}
              </div>
            )}
          </div>

          <SidebarRow label="Source" value={orDash(partner.source)} />
          <SidebarRow label="Service area" value={orDash(partner.service_area)} />
          <div className="border-t border-line pt-3">
            <p className="mb-1 text-xs text-ink-faint">Website</p>
            {partner.website ? (
              <a
                href={
                  /^https?:/i.test(partner.website)
                    ? partner.website
                    : `https://${partner.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-clay hover:text-clay-dark"
              >
                {partner.website}
              </a>
            ) : (
              <p className="text-ink-faint">—</p>
            )}
          </div>

        </div>
      </Card>

      {partner.status !== "closed" && (
        <ConfirmButton
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-danger/10 hover:text-danger-dark"
          title="Mark closed or wrong fit?"
          message="This hides the partner from the default list (it is not deleted). You can still find them by filtering to Closed."
          confirmLabel="Mark closed"
          onConfirm={async () => {
            const res = await markClosed(partner.id);
            if (res.ok) {
              onSuccess("Partner marked closed.");
              onDone();
            } else {
              onError(res.error);
            }
          }}
        >
          Mark closed or wrong fit
        </ConfirmButton>
      )}
    </div>
  );
}

function SidebarRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-3">
      <p className="mb-1 text-xs text-ink-faint">{label}</p>
      <p className="text-ink">{value}</p>
    </div>
  );
}
