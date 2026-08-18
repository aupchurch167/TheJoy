"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  saveStudioDraft,
  sendStudioOrSchedule,
  sendStudioTest,
  previewRecipients,
} from "./actions";
import {
  renderEmailModel,
  EMAIL_THEMES,
  seasonalMonthName,
  type EmailModel,
  type EmailTheme,
} from "@/lib/email-model";
import type { Broadcast } from "@/lib/broadcasts";
import { BackLink } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";

/* ------------------------------------------------------------------ */
/* Types + constants                                                   */
/* ------------------------------------------------------------------ */

export type StudioEvent = {
  id: string;
  title: string;
  whenText: string;
  location: string | null;
  rsvpUrl: string;
  yes: number;
};

type Audience = "leads" | "families";
type ApiOccasion =
  | "birthday"
  | "holiday"
  | "event"
  | "celebration"
  | "thank_you"
  | "announcement";

type Occasion = {
  key: string;
  label: string;
  api: ApiOccasion;
  theme: EmailTheme;
  /** Shows the details plan + event linking. */
  planned: boolean;
};

const OCCASIONS: Occasion[] = [
  { key: "birthday", label: "Birthday 🎂", api: "birthday", theme: "festive", planned: true },
  { key: "event", label: "Event", api: "event", theme: "classic", planned: true },
  { key: "holiday", label: "Holiday", api: "holiday", theme: "seasonal", planned: false },
  { key: "monthly", label: "Monthly note", api: "announcement", theme: "classic", planned: false },
  { key: "thankyou", label: "Thank you", api: "thank_you", theme: "elegant", planned: false },
];

function emptyModel(): EmailModel {
  return {
    theme: "classic",
    eyebrow: "",
    heroTitle: "",
    heroSub: "",
    greeting: "Hi {{first_name}},",
    intro: "",
    plan: null,
    rsvpUrl: null,
    photoUrl: null,
    closing: "Warmly,\nMellissa and the Joy team",
  };
}

/** Any unfilled [bracketed placeholder] left in the words (blocks a confident send). */
function findPlaceholders(m: EmailModel, subject: string): string[] {
  const hay = [
    subject,
    m.eyebrow,
    m.heroTitle,
    m.heroSub,
    m.greeting,
    m.intro,
    m.plan?.when,
    m.plan?.where,
    m.plan?.treats,
    m.closing,
  ]
    .filter(Boolean)
    .join("\n");
  const found = hay.match(/\[[^\]\n]{1,60}\]/g) || [];
  return Array.from(new Set(found));
}

function hasWords(m: EmailModel): boolean {
  return !!(m.heroTitle?.trim() || m.intro?.trim());
}

/* ------------------------------------------------------------------ */
/* Small UI atoms (studio-local, so the layout stays self-contained)   */
/* ------------------------------------------------------------------ */

const LABEL = "text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint";

function RailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-line px-5 py-4">
      <div className={`${LABEL} mb-3`}>{title}</div>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-semibold text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

const FIELD =
  "w-full rounded-[10px] border-[1.5px] border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/25";

/* ------------------------------------------------------------------ */
/* Studio                                                              */
/* ------------------------------------------------------------------ */

export default function EmailStudio({
  broadcast,
  events,
  defaultTestTo,
  aiEnabled,
  emailReady,
}: {
  broadcast?: Broadcast | null;
  events: StudioEvent[];
  defaultTestTo: string;
  aiEnabled: boolean;
  emailReady: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const initialModel: EmailModel =
    (broadcast?.model_json as EmailModel | null) ?? emptyModel();

  const [id, setId] = useState<string | undefined>(broadcast?.id);
  const [audience, setAudience] = useState<Audience>(
    (broadcast?.audience as Audience) ?? "families"
  );
  const [occasionKey, setOccasionKey] = useState<string>("monthly");
  const [brief, setBrief] = useState("");
  const [subject, setSubject] = useState(
    broadcast && broadcast.subject !== "(no subject yet)" ? broadcast.subject : ""
  );
  const [model, setModel] = useState<EmailModel>(initialModel);
  const [themeTouched, setThemeTouched] = useState<boolean>(!!broadcast);
  const [linkedEventId, setLinkedEventId] = useState<string | null>(null);
  const [editWords, setEditWords] = useState(false);

  const [busy, setBusy] = useState(false);
  const [tweaking, setTweaking] = useState<string | null>(null);
  const [tweakNote, setTweakNote] = useState<string | null>(null);
  const [askText, setAskText] = useState("");

  const [testTo, setTestTo] = useState(defaultTestTo);
  const [testSentTo, setTestSentTo] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const [recipients, setRecipients] = useState<number | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [sentState, setSentState] = useState<
    { kind: "sent" | "scheduled"; note: string } | null
  >(null);

  const [, startSave] = useTransition();
  const sent = !!sentState;

  const occasion = OCCASIONS.find((o) => o.key === occasionKey) ?? OCCASIONS[3];

  /* --- live recipient count --- */
  useEffect(() => {
    let alive = true;
    previewRecipients({ audience, filters: {} })
      .then((n) => alive && setRecipients(n))
      .catch(() => alive && setRecipients(null));
    return () => {
      alive = false;
    };
  }, [audience]);

  /* --- preview HTML --- */
  const previewHtml = useMemo(() => renderEmailModel(model), [model]);

  const patch = (p: Partial<EmailModel>) => setModel((m) => ({ ...m, ...p }));
  const patchPlan = (p: Partial<NonNullable<EmailModel["plan"]>>) =>
    setModel((m) => ({ ...m, plan: { ...(m.plan ?? {}), ...p } }));

  /* --- occasion change: pick a fitting look unless one was chosen --- */
  function chooseOccasion(o: Occasion) {
    setOccasionKey(o.key);
    if (!themeTouched) patch({ theme: o.theme });
    if (!o.planned && model.plan) patch({ plan: null });
  }

  function chooseTheme(t: EmailTheme) {
    setThemeTouched(true);
    patch({ theme: t });
  }

  /* --- AI generate --- */
  async function generate() {
    if (!aiEnabled) {
      toast.error("AI is not set up yet (ANTHROPIC_API_KEY).");
      return;
    }
    if (!brief.trim()) {
      toast.error("Tell the AI what the email is about first.");
      return;
    }
    setBusy(true);
    setTweakNote(null);
    try {
      const res = await fetch("/api/admin/draft-email-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: brief, audience, occasion: occasion.api }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "The draft failed.");
      const d = data.draft;
      setModel((m) => ({
        ...m,
        eyebrow: d.eyebrow || "",
        heroTitle: d.heroTitle || "",
        heroSub: d.heroSub || "",
        greeting: d.greeting || m.greeting,
        intro: d.intro || "",
        plan: occasion.planned ? d.plan ?? m.plan : null,
        closing: d.closing || m.closing,
      }));
      setSubject(d.subject || subject);
      setTweakNote("Draft ready. Tap any field to fine-tune, or ask for a change.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The draft failed.");
    } finally {
      setBusy(false);
    }
  }

  /* --- AI tweak (ask for a change) --- */
  async function tweak(instruction: string, label: string) {
    if (!aiEnabled) {
      toast.error("AI is not set up yet (ANTHROPIC_API_KEY).");
      return;
    }
    if (!hasWords(model)) {
      toast.error("Write or generate the email first.");
      return;
    }
    setTweaking(label);
    setTweakNote(null);
    try {
      const current = {
        subject,
        eyebrow: model.eyebrow,
        heroTitle: model.heroTitle,
        heroSub: model.heroSub,
        greeting: model.greeting,
        intro: model.intro,
        plan: model.plan ?? null,
        closing: model.closing,
      };
      const res = await fetch("/api/admin/draft-email-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          occasion: occasion.api,
          current,
          instruction,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "The change failed.");
      const d = data.draft;
      setModel((m) => ({
        ...m,
        eyebrow: d.eyebrow ?? m.eyebrow,
        heroTitle: d.heroTitle ?? m.heroTitle,
        heroSub: d.heroSub ?? m.heroSub,
        greeting: d.greeting ?? m.greeting,
        intro: d.intro ?? m.intro,
        plan: occasion.planned ? d.plan ?? m.plan : m.plan,
        closing: d.closing ?? m.closing,
      }));
      setSubject(d.subject || subject);
      setTweakNote(`✦ ${label} done.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The change failed.");
    } finally {
      setTweaking(null);
    }
  }

  function askForChange() {
    const t = askText.trim();
    if (!t) return;
    setAskText("");
    tweak(t, "Change");
  }

  /* --- event linking --- */
  function linkEvent(ev: StudioEvent) {
    setLinkedEventId(ev.id);
    setModel((m) => ({
      ...m,
      rsvpUrl: ev.rsvpUrl,
      plan: {
        ...(m.plan ?? {}),
        when: ev.whenText || m.plan?.when || "",
        where: ev.location || m.plan?.where || "here at Joy",
      },
    }));
  }
  function unlinkEvent() {
    setLinkedEventId(null);
    patch({ rsvpUrl: null });
  }

  /* --- persistence --- */
  function modelPayload() {
    return {
      id,
      subject,
      audience,
      filters: {},
      model,
    };
  }

  function saveNow(silent = false) {
    startSave(async () => {
      const res = await saveStudioDraft(modelPayload());
      if (res.ok) {
        setId(res.id);
        if (!silent) toast.success(res.message);
      } else if (!silent) {
        toast.error(res.error);
      }
    });
  }

  async function runTest() {
    if (!emailReady) {
      toast.error("Email is not set up yet (RESEND_API_KEY).");
      return;
    }
    setTesting(true);
    try {
      const res = await sendStudioTest({ subject, model, to: testTo });
      if (res.ok) {
        setTestSentTo(testTo || "your default address");
        toast.success(res.message);
      } else {
        toast.error(res.error);
      }
    } finally {
      setTesting(false);
    }
  }

  async function doSend(when?: string) {
    const res = await sendStudioOrSchedule({ ...modelPayload(), when });
    if (res.ok) {
      setId(res.id);
      setShowReview(false);
      setSentState({
        kind: when ? "scheduled" : "sent",
        note: res.message,
      });
    } else {
      toast.error(res.error);
    }
  }

  const placeholders = findPlaceholders(model, subject);
  const words = hasWords(model);

  /* ================================================================ */

  return (
    <div className="fixed inset-x-0 bottom-0 top-14 z-20 overflow-auto bg-paper lg:left-60 lg:top-0">
      <div className="mx-auto min-w-[1280px] max-w-[1520px]">
        <div className="grid grid-cols-[300px_minmax(0,1fr)_284px]">
          {/* ---------- LEFT: the brief ---------- */}
          <aside className="min-h-screen border-r border-line bg-white">
            <div className="px-5 pt-5">
              <BackLink href="/admin/emails">All emails</BackLink>
              <h1 className="mt-2 font-display text-[22px] font-semibold text-ink">
                {broadcast ? "Edit email" : "New email"}
              </h1>
              <p className="mt-0.5 text-xs text-ink-faint">
                {sent
                  ? sentState!.kind === "sent"
                    ? "Sent"
                    : "Scheduled"
                  : id
                    ? "Draft · saved"
                    : "Draft · not saved yet"}
              </p>
            </div>

            <div className="mt-4">
              <RailSection title="Send to">
                <div className="flex rounded-[9px] bg-surface p-[3px]">
                  {(["families", "leads"] as Audience[]).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAudience(a)}
                      className={`flex-1 rounded-[7px] px-2 py-1.5 text-sm font-semibold capitalize transition-colors ${
                        audience === a
                          ? "bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                          : "text-ink-soft"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
                  <span className="inline-block h-[7px] w-[7px] rounded-full bg-sage" />
                  {recipients == null
                    ? "counting…"
                    : `${recipients} recipient${recipients === 1 ? "" : "s"}`}{" "}
                  · opted-out always skipped
                </p>
                {audience === "families" && (
                  <div className="mt-3 rounded-lg border border-gold/30 bg-gold/[0.07] px-3 py-2 text-[11.5px] leading-snug text-[#8a6217]">
                    <strong>Community-wide only.</strong> Never individual resident
                    details; urgent news stays a phone call.
                  </div>
                )}
              </RailSection>

              <RailSection title="What's the email about?">
                <textarea
                  className={`${FIELD} min-h-[92px] resize-y`}
                  placeholder="e.g. Invite families to Mary's 90th birthday party on Friday the 26th at 3pm, cake and old records."
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {OCCASIONS.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => chooseOccasion(o)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        occasionKey === o.key
                          ? "bg-clay text-white"
                          : "bg-surface text-ink-soft hover:bg-line"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={generate}
                  disabled={busy}
                  className="mt-3 w-full rounded-[10px] bg-clay px-3 py-2.5 text-sm font-bold text-white shadow-[0_2px_6px_rgba(1,167,206,0.35)] transition-opacity hover:opacity-95 disabled:opacity-60"
                >
                  {busy ? "Writing…" : "✦ Write it for me"}
                </button>
                <p className="mt-1.5 text-[11px] text-ink-faint">
                  Drafts in Joy&apos;s voice. Never sends on its own.
                </p>
              </RailSection>

              {occasion.planned && (
                <RailSection title="Link an event">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] text-ink-faint">
                      Fills when &amp; where, adds an RSVP button.
                    </span>
                    <Link
                      href="/admin/events/new"
                      className="whitespace-nowrap text-xs font-semibold text-clay-dark hover:underline"
                    >
                      ＋ New
                    </Link>
                  </div>
                  {events.length === 0 ? (
                    <p className="text-xs text-ink-faint">No upcoming events yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {events.map((ev) => {
                        const on = linkedEventId === ev.id;
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => (on ? unlinkEvent() : linkEvent(ev))}
                            className={`block w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                              on
                                ? "border-[1.5px] border-clay bg-clay/[0.06]"
                                : "border-line hover:bg-paper"
                            }`}
                          >
                            <div className="text-[12.5px] font-semibold text-ink">
                              {ev.title}
                            </div>
                            <div className="text-[11px] text-ink-faint">
                              {ev.whenText}
                              {ev.yes > 0 ? ` · ${ev.yes} RSVP${ev.yes === 1 ? "" : "s"}` : ""}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {linkedEventId && (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-sage/10 px-3 py-1.5 text-[11px] text-sage">
                      <span>✓ RSVP button linked.</span>
                      <button
                        type="button"
                        onClick={unlinkEvent}
                        className="font-semibold underline"
                      >
                        Unlink
                      </button>
                    </div>
                  )}
                </RailSection>
              )}
            </div>
          </aside>

          {/* ---------- CENTER: canvas ---------- */}
          <main className="flex min-h-screen flex-col">
            {/* top bar */}
            <div className="flex items-center gap-3 border-b border-line bg-white px-6 py-3">
              <span className="text-xs font-semibold text-ink-faint">Subject</span>
              <input
                className="flex-1 rounded-md border border-transparent px-2 py-1.5 text-sm font-semibold text-ink transition-colors hover:border-line focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/25"
                placeholder="Write a subject…"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <button
                type="button"
                onClick={() => tweak("Write a different subject line.", "New subject")}
                disabled={!!tweaking || !words}
                className="whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-semibold text-clay-dark hover:bg-paper disabled:opacity-50"
              >
                {tweaking === "New subject" ? "…" : "✦ Suggest"}
              </button>
              <button
                type="button"
                onClick={() => saveNow()}
                className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper"
              >
                Save draft
              </button>
              <button
                type="button"
                onClick={() => setShowReview(true)}
                disabled={sent}
                className="whitespace-nowrap rounded-[10px] bg-clay px-4 py-1.5 text-sm font-bold text-white shadow-[0_2px_6px_rgba(1,167,206,0.35)] hover:opacity-95 disabled:opacity-60"
              >
                {sent
                  ? sentState!.kind === "sent"
                    ? "Sent ✓"
                    : "Scheduled ✓"
                  : "Review & send →"}
              </button>
            </div>

            {/* canvas */}
            <div
              className="flex-1 overflow-y-auto px-6 py-6"
              style={{
                background:
                  "radial-gradient(circle at 50% 0%, #f2f5f6, #e8ecee)",
              }}
            >
              <p className="mx-auto mb-3 max-w-[640px] text-center text-xs text-ink-faint">
                {words
                  ? "[first name] fills in per recipient. Edit the words below the preview."
                  : "Your email appears here."}
              </p>

              {words ? (
                <div className="mx-auto max-w-[640px]">
                  <div className="overflow-hidden rounded-[14px] border border-line bg-white shadow-sm">
                    <iframe
                      title="Email preview"
                      srcDoc={previewHtml}
                      className="h-[760px] w-full"
                    />
                  </div>

                  {/* edit the words */}
                  <div className="mt-4 rounded-[12px] border border-line bg-white">
                    <button
                      type="button"
                      onClick={() => setEditWords((v) => !v)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <span className={LABEL}>✎ Edit the words</span>
                      <span className="text-xs text-ink-faint">
                        {editWords ? "Hide" : "Show"}
                      </span>
                    </button>
                    {editWords && (
                      <div className="border-t border-line px-4 py-4">
                        <FieldRow label="Eyebrow (small line above the title)">
                          <input
                            className={FIELD}
                            value={model.eyebrow ?? ""}
                            onChange={(e) => patch({ eyebrow: e.target.value })}
                            placeholder="You're invited"
                          />
                        </FieldRow>
                        <FieldRow label="Headline">
                          <input
                            className={FIELD}
                            value={model.heroTitle ?? ""}
                            onChange={(e) => patch({ heroTitle: e.target.value })}
                          />
                        </FieldRow>
                        <FieldRow label="Subtitle (optional)">
                          <input
                            className={FIELD}
                            value={model.heroSub ?? ""}
                            onChange={(e) => patch({ heroSub: e.target.value })}
                          />
                        </FieldRow>
                        <FieldRow label="Greeting">
                          <input
                            className={FIELD}
                            value={model.greeting}
                            onChange={(e) => patch({ greeting: e.target.value })}
                          />
                        </FieldRow>
                        <FieldRow label="Message">
                          <textarea
                            className={`${FIELD} min-h-[120px] resize-y`}
                            value={model.intro}
                            onChange={(e) => patch({ intro: e.target.value })}
                          />
                        </FieldRow>

                        {(occasion.planned || model.plan) && (
                          <div className="mb-3 rounded-lg border border-line bg-paper p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-semibold text-ink-soft">
                                Details card
                              </span>
                              {model.plan ? (
                                <button
                                  type="button"
                                  onClick={() => patch({ plan: null })}
                                  className="text-[11px] font-semibold text-danger hover:underline"
                                >
                                  Remove
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    patch({ plan: { when: "", where: "here at Joy", treats: "" } })
                                  }
                                  className="text-[11px] font-semibold text-clay-dark hover:underline"
                                >
                                  ＋ Add
                                </button>
                              )}
                            </div>
                            {model.plan && (
                              <>
                                <FieldRow label="When">
                                  <input
                                    className={FIELD}
                                    value={model.plan.when ?? ""}
                                    onChange={(e) => patchPlan({ when: e.target.value })}
                                    placeholder="Friday, September 26 at 3:00pm"
                                  />
                                </FieldRow>
                                <FieldRow label="Where">
                                  <input
                                    className={FIELD}
                                    value={model.plan.where ?? ""}
                                    onChange={(e) => patchPlan({ where: e.target.value })}
                                  />
                                </FieldRow>
                                <FieldRow label="Treats (optional)">
                                  <input
                                    className={FIELD}
                                    value={model.plan.treats ?? ""}
                                    onChange={(e) => patchPlan({ treats: e.target.value })}
                                  />
                                </FieldRow>
                              </>
                            )}
                          </div>
                        )}

                        <FieldRow label="Sign-off">
                          <textarea
                            className={`${FIELD} min-h-[60px] resize-y`}
                            value={model.closing}
                            onChange={(e) => patch({ closing: e.target.value })}
                          />
                        </FieldRow>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex min-h-[420px] max-w-[640px] items-center justify-center">
                  <div className="w-full rounded-[14px] border-2 border-dashed border-line bg-white/60 px-6 py-20 text-center">
                    {busy ? (
                      <p className="animate-pulse text-sm text-clay-dark">
                        ✦ Writing in Joy&apos;s voice…
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-ink-soft">
                          Your email appears here
                        </p>
                        <p className="mt-1 text-xs text-ink-faint">
                          Write a brief on the left and press “Write it for me”, or
                          pick a look and type the words yourself.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* ---------- RIGHT: look & feel ---------- */}
          <aside className="min-h-screen border-l border-line bg-white">
            <RailSection title="Look & feel">
              <div className="grid grid-cols-2 gap-2">
                {EMAIL_THEMES.map((t) => {
                  const on = model.theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => chooseTheme(t.id)}
                      className={`rounded-[10px] border p-2 text-left transition-colors ${
                        on
                          ? "border-2 border-clay shadow-[0_0_0_3px_rgba(1,167,206,0.12)]"
                          : "border border-line hover:bg-paper"
                      }`}
                    >
                      <span
                        className="mb-1.5 block h-[34px] w-full rounded-md"
                        style={{ background: THEME_SWATCH[t.id] }}
                      />
                      <span className="text-[11.5px] font-semibold text-ink">
                        {t.id === "seasonal" ? `Seasonal · ${seasonalMonthName()}` : t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-ink-faint">
                Swapping the look keeps your words.
              </p>
              {model.theme === "seasonal" && (
                <p className="mt-1.5 rounded-md bg-surface px-2 py-1.5 text-[11px] text-ink-soft">
                  Seasonal picks the colors for the month it sends in (right now,{" "}
                  {seasonalMonthName()}).
                </p>
              )}
              {model.theme === "photo" && (
                <PhotoField
                  url={model.photoUrl ?? null}
                  onUrl={(u) => patch({ photoUrl: u })}
                />
              )}
            </RailSection>

            <RailSection title="Ask for a change">
              <div className="flex gap-1.5">
                <input
                  className={FIELD}
                  placeholder="e.g. mention the garden"
                  value={askText}
                  onChange={(e) => setAskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      askForChange();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={askForChange}
                  disabled={!!tweaking}
                  className="rounded-[10px] bg-surface px-3 text-sm font-semibold text-ink-soft hover:bg-line disabled:opacity-50"
                >
                  {tweaking === "Change" ? "…" : "Apply"}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  { label: "Shorter", instr: "Make it shorter and tighter." },
                  { label: "Warmer", instr: "Make it a little warmer and more personal." },
                ].map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => tweak(c.instr, c.label)}
                    disabled={!!tweaking}
                    className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-line disabled:opacity-50"
                  >
                    {tweaking === c.label ? "…" : c.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => chooseTheme("photo")}
                  className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-line"
                >
                  Add a photo
                </button>
              </div>
              {tweakNote && (
                <p className="mt-2 text-[11px] font-semibold text-sage">{tweakNote}</p>
              )}
            </RailSection>

            <RailSection title="Send a test first">
              <div className="flex gap-1.5">
                <input
                  className={FIELD}
                  type="email"
                  placeholder="you@email.com"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                />
                <button
                  type="button"
                  onClick={runTest}
                  disabled={testing || !words}
                  className="rounded-[10px] bg-surface px-3 text-sm font-semibold text-ink-soft hover:bg-line disabled:opacity-50"
                >
                  {testing ? "…" : "Test"}
                </button>
              </div>
              {testSentTo && (
                <p className="mt-2 text-[11px] font-semibold text-sage">
                  ✓ Test sent to {testSentTo}.
                </p>
              )}
            </RailSection>

            <RailSection title="Checks before send">
              <Check ok label="Personalization ({{first_name}})" />
              <Check ok label="Unsubscribe link added" />
              <Check
                ok={placeholders.length === 0}
                label={
                  placeholders.length === 0
                    ? "No leftover [placeholders]"
                    : `Fill in: ${placeholders.join(", ")}`
                }
              />
              <Check ok={!!testSentTo} label="Send yourself a test first" warn />
            </RailSection>
          </aside>
        </div>
      </div>

      {showReview && (
        <ReviewSheet
          audience={audience}
          recipients={recipients}
          subject={subject}
          testSentTo={testSentTo}
          placeholders={placeholders}
          linkedEvent={events.find((e) => e.id === linkedEventId) ?? null}
          onClose={() => setShowReview(false)}
          onSend={doSend}
          onTest={runTest}
          sentState={sentState}
          onAnother={() => {
            window.location.href = "/admin/emails/new";
          }}
          onView={() => id && router.push(`/admin/emails/${id}`)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Supporting components                                               */
/* ------------------------------------------------------------------ */

const THEME_SWATCH: Record<EmailTheme, string> = {
  festive: "linear-gradient(135deg,#e85d75,#f7b32b)",
  classic: "#017391",
  seasonal: "linear-gradient(135deg,#b0722a,#c96328)",
  garden: "#1c7f27",
  elegant: "linear-gradient(135deg,#123a44,#96731f)",
  photo: "repeating-linear-gradient(45deg,#eef2f3 0 8px,#d9e0e2 8px 16px)",
  plain: "#fbf9f5",
};

function Check({ ok, label, warn }: { ok: boolean; label: string; warn?: boolean }) {
  const mark = ok ? "✓" : warn ? "•" : "⚠";
  const color = ok ? "text-sage" : warn ? "text-gold" : "text-danger";
  return (
    <div className="flex items-start gap-2 py-0.5 text-xs text-ink-soft">
      <span className={`font-bold ${color}`}>{mark}</span>
      <span>{label}</span>
    </div>
  );
}

function PhotoField({
  url,
  onUrl,
}: {
  url: string | null;
  onUrl: (u: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function upload(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Upload failed.");
      onUrl(data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-line bg-paper p-2.5">
      <span className="mb-1.5 block text-[11px] font-semibold text-ink-soft">
        Photo at the top
      </span>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="mb-2 w-full rounded-md" />
      ) : null}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex-1 rounded-md bg-surface px-2 py-1.5 text-xs font-semibold text-ink-soft hover:bg-line disabled:opacity-50"
        >
          {busy ? "Uploading…" : url ? "Replace" : "Upload a photo"}
        </button>
        {url && (
          <button
            type="button"
            onClick={() => onUrl(null)}
            className="rounded-md px-2 py-1.5 text-xs font-semibold text-danger hover:bg-white"
          >
            Remove
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function ReviewSheet({
  audience,
  recipients,
  subject,
  testSentTo,
  placeholders,
  linkedEvent,
  onClose,
  onSend,
  onTest,
  sentState,
  onAnother,
  onView,
}: {
  audience: Audience;
  recipients: number | null;
  subject: string;
  testSentTo: string | null;
  placeholders: string[];
  linkedEvent: StudioEvent | null;
  onClose: () => void;
  onSend: (when?: string) => Promise<void>;
  onTest: () => Promise<void>;
  sentState: { kind: "sent" | "scheduled"; note: string } | null;
  onAnother: () => void;
  onView: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [pickAt, setPickAt] = useState("");
  const audienceLabel = audience === "families" ? "families" : "leads";
  const count = recipients ?? 0;

  async function fire(when?: string) {
    setSending(true);
    try {
      await onSend(when);
    } finally {
      setSending(false);
    }
  }

  function at9(daysAhead: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(9, 0, 0, 0);
    return d.toISOString();
  }
  function nextFriday9(): string {
    const d = new Date();
    const delta = (5 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + delta);
    d.setHours(9, 0, 0, 0);
    return d.toISOString();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(7,20,23,0.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] rounded-[18px] bg-white p-6 shadow-[0_24px_60px_rgba(7,20,23,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        {sentState ? (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-xl text-white">
              ✓
            </div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              {sentState.kind === "sent"
                ? `On its way to ${count} ${audienceLabel}`
                : "Scheduled"}
            </h2>
            <p className="mt-2 text-sm text-ink-soft">{sentState.note}</p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onAnother}
                className="flex-1 rounded-[10px] bg-clay px-4 py-2.5 text-sm font-bold text-white hover:opacity-95"
              >
                Start another email
              </button>
              <button
                type="button"
                onClick={onView}
                className="rounded-[10px] border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-paper"
              >
                View the email
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Ready to send?
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              One last look. Nothing goes out until you press the blue button.
            </p>

            <div className="mt-4 divide-y divide-line rounded-xl border border-line">
              <Row label="To">
                {count} {audienceLabel} · opted-out skipped
              </Row>
              <Row label="Subject">
                {subject.trim() ? (
                  subject
                ) : (
                  <span className="font-semibold text-danger">⚠ No subject yet</span>
                )}
              </Row>
              <Row label="Test email">
                {testSentTo ? (
                  <span className="text-sage">✓ Sent to {testSentTo}</span>
                ) : (
                  <span className="text-gold">Not sent yet (recommended)</span>
                )}
              </Row>
            </div>

            <div className="mt-4 space-y-1">
              {audience === "families" && (
                <Check ok label="Community-wide, no individual resident details" />
              )}
              <Check ok label="First name + unsubscribe included" />
              <Check
                ok={placeholders.length === 0}
                label={
                  placeholders.length === 0
                    ? "No leftover [placeholders]"
                    : `Fill in first: ${placeholders.join(", ")}`
                }
              />
              {linkedEvent && (
                <Check
                  ok
                  label={`RSVP button links to ${linkedEvent.title} (signups land in Events)`}
                />
              )}
            </div>

            {showSchedule ? (
              <div className="mt-5 rounded-xl border border-line p-3">
                <div className="mb-2 text-xs font-semibold text-ink-soft">
                  When should it go out?
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => fire(at9(1))}
                    className="rounded-lg bg-surface px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-line"
                  >
                    Tomorrow 9am
                  </button>
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => fire(nextFriday9())}
                    className="rounded-lg bg-surface px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-line"
                  >
                    Friday 9am
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={pickAt}
                    onChange={(e) => setPickAt(e.target.value)}
                    className={FIELD}
                  />
                  <button
                    type="button"
                    disabled={sending || !pickAt}
                    onClick={() => fire(new Date(pickAt).toISOString())}
                    className="whitespace-nowrap rounded-lg bg-clay px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  disabled={sending || !subject.trim() || count === 0}
                  onClick={() => fire()}
                  className="flex-[1.4] rounded-[10px] bg-clay px-4 py-3 text-sm font-bold text-white shadow-[0_2px_6px_rgba(1,167,206,0.35)] hover:opacity-95 disabled:opacity-50"
                >
                  {sending ? "Sending…" : `Send now to ${count} ${audienceLabel}`}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSchedule(true)}
                  className="rounded-[10px] border border-line px-4 py-3 text-sm font-semibold text-ink-soft hover:bg-paper"
                >
                  🗓 Schedule…
                </button>
              </div>
            )}

            {!testSentTo && (
              <div className="mt-3 flex items-center justify-between text-xs text-ink-faint">
                <span>Send a test to yourself first?</span>
                <button
                  type="button"
                  onClick={onTest}
                  className="font-semibold text-clay-dark hover:underline"
                >
                  Send test
                </button>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11px] text-ink-faint">
              <button type="button" onClick={onClose} className="hover:underline">
                ← Keep editing
              </button>
              <span>Nothing is undoable after send (that&apos;s why the test).</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5 text-sm">
      <span className="text-ink-faint">{label}</span>
      <span className="text-right text-ink">{children}</span>
    </div>
  );
}
