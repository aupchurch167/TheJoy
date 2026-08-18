"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendTextBlast, sendTestToAdmins } from "./actions";
import { useToast } from "@/components/admin/Toast";
import { formatDateTime } from "@/lib/format";

const OPT_OUT = "\n\nReply STOP to opt out.";

const STARTERS = [
  {
    label: "⏰ Reminder",
    text: "Reminder: family night is tonight at 6pm at Joy. Hope to see you!",
  },
  {
    label: "🌧 Weather",
    text: "Weather note: Joy is open as usual today and everyone is safe and warm. Drive carefully if you're coming by.",
  },
  {
    label: "🎉 Today",
    text: "Happening today: cake and ice cream on the porch at 3pm. Come by if you can!",
  },
];

const LABEL = "text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint";

export type RecentText = {
  id: string;
  body: string;
  sent_at: string | null;
  sent_count: number;
};

export default function TextComposer({
  enabled,
  recipientCount,
  testNumberCount,
  recent,
}: {
  enabled: boolean;
  recipientCount: number;
  testNumberCount: number;
  recent: RecentText[];
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [body, setBody] = useState("");
  const [testedBody, setTestedBody] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [testing, setTesting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sentFlash, setSentFlash] = useState(false);

  const trimmed = body.trim();
  const isTested = testedBody !== null && testedBody === trimmed;

  const total = body.length + (body ? OPT_OUT.length : 0);
  const segments = total === 0 ? 0 : total <= 160 ? 1 : Math.ceil(total / 153);

  const canTest = enabled && trimmed !== "" && testNumberCount > 0 && !testing && !isTested;
  const canBlast = enabled && isTested && recipientCount > 0 && !confirmOpen;

  function edit(next: string) {
    setBody(next);
    setConfirmOpen(false);
  }

  function tidyUp() {
    if (!trimmed) return;
    const cleaned =
      trimmed.replace(/\s+/g, " ").replace(/^./, (c) => c.toUpperCase()) +
      (/[.!?]$/.test(trimmed) ? "" : "!");
    edit(cleaned);
  }

  async function onTest() {
    setTesting(true);
    const res = await sendTestToAdmins(body);
    setTesting(false);
    if (!res.ok) {
      toastError(res.error);
      return;
    }
    setTestedBody(trimmed);
    success(
      `Test sent to ${res.sent} owner/admin number${res.sent === 1 ? "" : "s"}. Review it, then send below.`
    );
  }

  function onBlast() {
    start(async () => {
      const res = await sendTextBlast(body);
      if (!res.ok) {
        if (res.needsTest) setTestedBody(null);
        setConfirmOpen(false);
        toastError(res.error);
        return;
      }
      setConfirmOpen(false);
      setSentFlash(true);
      success(
        `Text sent to ${res.sent} of ${res.total} families${res.failed ? `, ${res.failed} failed` : ""}.`
      );
      setTimeout(() => {
        setSentFlash(false);
        setBody("");
        setTestedBody(null);
        router.refresh();
      }, 1600);
    });
  }

  const previewBody =
    (trimmed || "Your message shows here as you type…") + OPT_OUT;

  return (
    <div className="mx-auto max-w-[1060px]">
      {/* Header */}
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold text-ink">Texts</h1>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-ink-soft">
            Short, community-wide notes (a reminder, a weather closing, an event
            today). Goes only to families who said yes to texts.
          </p>
        </div>
        <div className="flex flex-none items-center gap-1.5 text-xs text-ink-soft">
          <span className="inline-block h-[7px] w-[7px] rounded-full bg-sage" />
          {enabled
            ? `${recipientCount} opted-in famil${recipientCount === 1 ? "y" : "ies"} · STOP always honored`
            : "sending disabled"}
        </div>
      </div>

      {!enabled && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          <span aria-hidden>⚠️</span>
          <div>
            <p className="font-medium text-ink">Texting isn&apos;t set up yet.</p>
            <p className="mt-1 text-ink-soft">
              Add <code>QUO_API_KEY</code> and <code>QUO_FROM_NUMBER</code>, and
              register the number for A2P texting in Quo. You can write a message,
              but sending is off (see OPERATIONS.md).
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Left: composer + steps + recent */}
        <div className="flex flex-col gap-4">
          {/* Composer card */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_3px_rgba(7,20,23,0.04)]">
            <div className="mb-2.5 flex items-center justify-between">
              <span className={LABEL}>New text</span>
              {total > 0 && (
                <span className={`text-xs ${segments > 2 ? "text-gold" : "text-ink-faint"}`}>
                  {body.length} chars · ~{segments} text{segments === 1 ? "" : "s"} each
                </span>
              )}
            </div>
            <textarea
              value={body}
              onChange={(e) => edit(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="e.g. Reminder: family night is tonight at 6pm at Joy. Hope to see you!"
              className="min-h-[96px] w-full resize-y rounded-[10px] border-[1.5px] border-line bg-white px-3 py-3 text-sm leading-relaxed text-ink placeholder:text-ink-faint focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/25"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap gap-1.5">
                {STARTERS.map((st) => (
                  <button
                    key={st.label}
                    type="button"
                    onClick={() => edit(st.text)}
                    className="rounded-full border border-line bg-white px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-clay hover:text-clay-dark"
                  >
                    {st.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={tidyUp}
                className="whitespace-nowrap text-xs font-semibold text-clay-dark hover:underline"
              >
                ✦ Tidy it up
              </button>
            </div>
            <p className="mt-1.5 text-[11.5px] text-ink-faint">
              &ldquo;Reply STOP to opt out.&rdquo; is added automatically.
            </p>
          </div>

          {/* Steps card */}
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(7,20,23,0.04)]">
            {/* Step 1: test */}
            <div className="flex items-center gap-3.5 border-b border-line px-5 py-4">
              <StepDot done={isTested}>{isTested ? "✓" : "1"}</StepDot>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  Send it to yourselves first
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {testNumberCount > 0 ? (
                    isTested ? (
                      `Sent to ${testNumberCount} owner/admin phone${testNumberCount === 1 ? "" : "s"} — check, then send below.`
                    ) : (
                      `This exact message goes to ${testNumberCount} owner/admin phone${testNumberCount === 1 ? "" : "s"}. Editing it means testing again.`
                    )
                  ) : (
                    <>
                      Add owner/admin numbers in{" "}
                      <Link href="/admin/settings" className="font-semibold text-clay-dark hover:underline">
                        Settings
                      </Link>{" "}
                      to enable testing.
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onTest}
                disabled={!canTest}
                className={`flex-none rounded-[9px] border border-line px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface disabled:opacity-60 ${
                  isTested ? "text-sage" : "text-ink"
                }`}
              >
                {testing ? "Sending…" : isTested ? "Test sent ✓" : "Send test"}
              </button>
            </div>
            {/* Step 2: blast */}
            <div
              className={`flex items-center gap-3.5 px-5 py-4 ${isTested ? "bg-clay/[0.04]" : ""}`}
            >
              <StepDot active={isTested}>2</StepDot>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">Send to families</p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {isTested
                    ? "Unlocked — this sends the exact message you just tested."
                    : trimmed
                      ? "Locked until you've tested this message."
                      : "Write a message first."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => canBlast && setConfirmOpen(true)}
                disabled={!canBlast || pending || sentFlash}
                className={`flex-none rounded-[9px] px-4 py-2.5 text-sm font-bold transition-colors ${
                  sentFlash
                    ? "bg-sage/15 text-sage"
                    : canBlast
                      ? "bg-clay text-white shadow-[0_2px_6px_rgba(1,167,206,0.35)] hover:opacity-95"
                      : "bg-surface text-ink-faint"
                }`}
              >
                {sentFlash
                  ? "Sent ✓"
                  : pending
                    ? "Sending…"
                    : `Send to ${recipientCount} famil${recipientCount === 1 ? "y" : "ies"}`}
              </button>
            </div>
          </div>

          {/* Inline confirm */}
          {confirmOpen && (
            <div className="flex items-center gap-3.5 rounded-xl border-[1.5px] border-clay bg-clay/[0.05] px-4 py-3.5">
              <p className="flex-1 text-[13px] leading-relaxed text-ink">
                <strong>Send this text now?</strong> It goes to {recipientCount}{" "}
                opted-in famil{recipientCount === 1 ? "y" : "ies"}. You already
                tested it. Texts can&apos;t be unsent.
              </p>
              <button
                type="button"
                onClick={onBlast}
                disabled={pending}
                className="flex-none rounded-[9px] bg-clay px-4 py-2 text-[13px] font-bold text-white hover:opacity-95 disabled:opacity-60"
              >
                {pending ? "Sending…" : "Yes, send it"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex-none text-[13px] font-semibold text-ink-soft hover:underline"
              >
                Not yet
              </button>
            </div>
          )}

          {/* Recent */}
          <div className="mt-2">
            <div className={`${LABEL} mb-2.5`}>Recent texts</div>
            {recent.length === 0 ? (
              <div className="rounded-2xl border border-line bg-white px-5 py-8 text-center text-sm text-ink-faint shadow-[0_1px_3px_rgba(7,20,23,0.04)]">
                No texts sent yet. Your blasts show here with how many families got them.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(7,20,23,0.04)]">
                {recent.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3.5 border-b border-line px-5 py-3.5 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink">{t.body}</p>
                      <p className="mt-0.5 text-[11.5px] text-ink-faint">
                        {t.sent_at ? formatDateTime(t.sent_at) : "—"}
                      </p>
                    </div>
                    <span className="flex-none rounded-full bg-sage/15 px-2.5 py-0.5 text-[11px] font-bold text-sage">
                      Sent to {t.sent_count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: phone preview */}
        <div className="sticky top-[34px] flex flex-col gap-3">
          <p className="text-center text-[11px] text-ink-faint">What families see</p>
          <div className="rounded-[34px] bg-ink p-2.5 shadow-[0_14px_34px_rgba(7,20,23,0.22)]">
            <div className="flex min-h-[430px] flex-col overflow-hidden rounded-[26px] bg-white">
              <div className="border-b border-line px-4 pb-2.5 pt-3.5 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-clay-dark font-display text-[17px] font-semibold text-white">
                  J
                </div>
                <div className="mt-1.5 text-xs font-semibold text-ink">
                  Joy Senior Living
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3.5">
                <div className="self-center text-[10px] text-ink-faint">Today</div>
                <div className="max-w-[88%] self-start whitespace-pre-line rounded-[16px] rounded-bl-[5px] bg-surface px-3 py-2.5 text-[13px] leading-relaxed text-ink">
                  {previewBody}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gold/30 bg-gold/[0.07] px-3 py-2.5 text-[11.5px] leading-relaxed text-[#8a6217]">
            <strong>Consent required.</strong> Only families marked{" "}
            <Link href="/admin/families" className="font-semibold underline">
              Texts: on
            </Link>{" "}
            in the Family list get these.
          </div>
        </div>
      </div>
    </div>
  );
}

function StepDot({
  children,
  done,
  active,
}: {
  children: React.ReactNode;
  done?: boolean;
  active?: boolean;
}) {
  const cls = done
    ? "bg-sage/15 text-sage"
    : active
      ? "bg-clay text-white"
      : "bg-surface text-ink-faint";
  return (
    <div
      className={`flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full text-xs font-bold ${cls}`}
    >
      {children}
    </div>
  );
}
