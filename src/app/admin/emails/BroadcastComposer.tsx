"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";
import { saveDraft, sendOrSchedule, removeBroadcast, sendTest } from "./actions";
import type { Broadcast } from "@/lib/broadcasts";
import type { Audience } from "@/lib/leads";
import { btn, BackLink, Badge, Card } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { useToast } from "@/components/admin/Toast";
import { formatDateTime } from "@/lib/format";

const INPUT =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30";

const AUDIENCE_LABEL: Record<Audience, string> = {
  leads: "all subscribed leads (families researching Joy)",
  families: "the family list (current residents' families)",
};

export default function BroadcastComposer({
  broadcast,
}: {
  broadcast?: Broadcast | null;
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [id, setId] = useState<string | undefined>(broadcast?.id);
  const [audience, setAudience] = useState<Audience>(
    broadcast?.audience ?? "leads"
  );
  const [subject, setSubject] = useState(broadcast?.subject ?? "");
  const [body, setBody] = useState(broadcast?.body ?? "");
  const [when, setWhen] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // "Create with AI" panel.
  const [aiContext, setAiContext] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  // Test send.
  const [testTo, setTestTo] = useState("");
  const [testBusy, setTestBusy] = useState(false);

  const sent = broadcast?.status === "sent";
  const isNew = !broadcast;

  function onSaveDraft() {
    setError("");
    start(async () => {
      const res = await saveDraft({ id, subject, body, audience });
      if (!res.ok) {
        setError(res.error);
        toastError(res.error);
        return;
      }
      setId(res.id);
      success(res.message || "Draft saved.");
      if (isNew) router.replace(`/admin/emails/${res.id}`);
      else router.refresh();
    });
  }

  async function onSend() {
    setError("");
    return new Promise<void>((resolve) => {
      start(async () => {
        const res = await sendOrSchedule({
          id,
          subject,
          body,
          audience,
          when: when || undefined,
        });
        if (!res.ok) {
          setError(res.error);
          toastError(res.error);
          resolve();
          return;
        }
        setId(res.id);
        success(res.message || (when ? "Scheduled." : "Sent."));
        router.refresh();
        resolve();
      });
    });
  }

  async function onDelete() {
    if (!id) return;
    const res = await removeBroadcast(id);
    if (res.ok) {
      success("Email deleted.");
      router.push("/admin/emails");
    } else {
      toastError("Could not delete the email.");
    }
  }

  async function onSendTest() {
    if (!subject.trim()) {
      setError("Add a subject before sending a test.");
      toastError("Add a subject before sending a test.");
      return;
    }
    setError("");
    setTestBusy(true);
    try {
      const res = await sendTest({ subject, body, to: testTo });
      if (!res.ok) {
        setError(res.error);
        toastError(res.error);
        return;
      }
      success(res.message);
    } finally {
      setTestBusy(false);
    }
  }

  async function generateWithAI() {
    if (!aiContext.trim()) {
      setAiError("Tell the AI what the email is about first.");
      return;
    }
    if (
      (subject.trim() || body.trim()) &&
      !window.confirm(
        "Replace the current subject and message with the AI draft?"
      )
    ) {
      return;
    }
    setAiError("");
    setAiBusy(true);
    try {
      const res = await fetch("/api/admin/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: aiContext, audience }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setAiError(json.error || "The AI draft failed.");
        toastError(json.error || "The AI draft failed.");
        return;
      }
      setSubject(json.draft.subject);
      setBody(json.draft.body);
      setTab("write");
      success("AI draft ready. Review and edit before sending.");
    } catch {
      setAiError("The AI draft failed. Please try again.");
    } finally {
      setAiBusy(false);
    }
  }

  async function uploadImage(file: File) {
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json.error || "Upload failed.");
      toastError(json.error || "Upload failed.");
      return;
    }
    setBody((b) => `${b}\n\n![](${json.url})\n`);
  }

  if (sent) {
    return (
      <div className="max-w-3xl">
        <BackLink href="/admin/emails">All emails</BackLink>
        <div className="mt-3 mb-6 flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            Email
          </h1>
          <Badge tone="success">sent</Badge>
        </div>
        <Card>
          <p className="font-medium text-ink">{broadcast?.subject}</p>
          <p className="mt-1 text-sm text-ink-faint">
            Sent to {broadcast?.sent_count} recipient(s)
            {broadcast?.sent_at ? ` on ${formatDateTime(broadcast.sent_at)}` : ""}{" "}
            ({AUDIENCE_LABEL[broadcast?.audience ?? "leads"]}).
          </p>
          <div className="mt-4 border-t border-line pt-4">
            <Markdown>{broadcast?.body || ""}</Markdown>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <BackLink href="/admin/emails">All emails</BackLink>
      <h1 className="mt-3 mb-6 font-display text-2xl font-semibold text-ink sm:text-3xl">
        {broadcast ? "Edit email" : "New email"}
      </h1>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <div className="grid gap-5">
        {/* Audience */}
        <label className="block">
          <span className="text-sm font-medium text-ink">Send to</span>
          {isNew ? (
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as Audience)}
              className={`${INPUT} mt-1.5 h-11 sm:max-w-md`}
            >
              <option value="leads">Leads (families researching Joy)</option>
              <option value="families">
                Families (current residents&apos; families)
              </option>
            </select>
          ) : (
            <p className="mt-1 text-ink">{AUDIENCE_LABEL[audience]}</p>
          )}
        </label>

        {audience === "families" && (
          <div className="flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-ink-soft">
            <span aria-hidden>⚠️</span>
            <p>
              <strong className="text-ink">Community-wide only.</strong> Parties,
              family nights, a monthly note, event photos. Never individual
              resident details, and never anything urgent (that stays a phone
              call).
            </p>
          </div>
        )}

        {/* Create with AI: describe the email, get a Joy-voice draft to edit. */}
        <div className="rounded-xl border border-clay/30 bg-clay/5 p-4">
          <p className="text-sm font-semibold text-ink">
            ✨ Create with AI
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            Describe the email and any details (event, date, the message you want
            to get across). The AI writes a draft in Joy&apos;s voice for the{" "}
            {audience === "families" ? "families" : "leads"} list. It never sends,
            and it fills in [placeholders] for anything you did not specify.
          </p>
          <textarea
            value={aiContext}
            onChange={(e) => setAiContext(e.target.value)}
            rows={3}
            className={`${INPUT} mt-2.5`}
            placeholder={
              audience === "families"
                ? "e.g. Invite families to a fall porch social on [date] at 3pm, with snacks and live music. Warm and casual."
                : "e.g. A gentle check-in for families researching care, sharing what makes a small home different and inviting them to book a tour or call Mellissa."
            }
          />
          {aiError && (
            <p className="mt-2 text-xs font-medium text-danger" role="alert">
              {aiError}
            </p>
          )}
          <div className="mt-2.5">
            <button
              type="button"
              onClick={generateWithAI}
              disabled={aiBusy}
              className={btn("secondary", "sm")}
            >
              {aiBusy ? "Writing…" : "Generate draft"}
            </button>
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-ink">Subject</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={`${INPUT} mt-1.5`}
            placeholder={
              audience === "families" ? "You're invited to Joy" : "A note from Joy"
            }
          />
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-ink">Message</label>
            <div className="flex items-center gap-2">
              <PhotoButton onFile={uploadImage} />
              <div className="flex overflow-hidden rounded-lg border border-line text-sm">
                <button
                  onClick={() => setTab("write")}
                  className={`px-3 py-1.5 font-medium transition-colors ${tab === "write" ? "bg-clay text-white" : "text-ink-soft hover:bg-surface"}`}
                >
                  Write
                </button>
                <button
                  onClick={() => setTab("preview")}
                  className={`px-3 py-1.5 font-medium transition-colors ${tab === "preview" ? "bg-clay text-white" : "text-ink-soft hover:bg-surface"}`}
                >
                  Preview
                </button>
              </div>
            </div>
          </div>
          {tab === "write" ? (
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="w-full rounded-lg border border-line bg-white px-4 py-3 font-mono text-sm leading-relaxed text-ink transition-colors focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30"
              placeholder="Write in Markdown. Short sentences. No em-dashes. Add photos with the Photo button. Every email includes an unsubscribe link automatically."
            />
          ) : (
            <div className="min-h-[14rem] rounded-lg border border-line bg-white px-6 py-6">
              {body.trim() ? (
                <Markdown>{body}</Markdown>
              ) : (
                <p className="text-ink-faint">Nothing to preview yet.</p>
              )}
            </div>
          )}
          <p className="mt-2 text-xs text-ink-faint">
            An unsubscribe link is added to every email automatically. Opted-out
            recipients are always skipped.
          </p>
        </div>

        {/* Send a test to yourself before the real blast. */}
        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-ink">Send a test first</p>
          <p className="mt-1 text-xs text-ink-soft">
            Sends this exact email (subject and formatting) to one address, marked
            [TEST], with a safe unsubscribe link. Leave blank to send to your team
            alert address.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="you@joyseniorcare.com"
              className={`${INPUT} h-10 sm:max-w-xs`}
            />
            <button
              type="button"
              onClick={onSendTest}
              disabled={testBusy || pending}
              className={btn("secondary", "sm")}
            >
              {testBusy ? "Sending test…" : "Send test"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-line bg-white p-4 shadow-sm">
          <label className="block">
            <span className="text-sm font-medium text-ink">
              Schedule for <span className="text-ink-faint">(optional)</span>
            </span>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="mt-1.5 block rounded-lg border border-line bg-white px-3 py-2 text-ink transition-colors focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30"
            />
          </label>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            {id && (
              <ConfirmButton
                variant="ghost"
                size="sm"
                title="Delete this email?"
                message="This permanently removes the draft."
                confirmLabel="Delete"
                onConfirm={onDelete}
              >
                Delete
              </ConfirmButton>
            )}
            <button
              onClick={onSaveDraft}
              disabled={pending}
              className={btn("secondary", "sm")}
            >
              Save draft
            </button>
            {when ? (
              <button
                onClick={onSend}
                disabled={pending}
                className={btn("primary", "sm")}
              >
                Schedule
              </button>
            ) : (
              <ConfirmButton
                variant="primary"
                size="sm"
                confirmVariant="primary"
                title="Send this email now?"
                message={
                  <>
                    This sends to {AUDIENCE_LABEL[audience]}. This cannot be
                    undone.
                  </>
                }
                confirmLabel="Send now"
                onConfirm={onSend}
              >
                Send now
              </ConfirmButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoButton({ onFile }: { onFile: (file: File) => Promise<void> }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface hover:text-ink disabled:opacity-60"
      >
        {busy ? "Uploading…" : "Photo"}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          await onFile(file);
          setBusy(false);
          e.target.value = "";
        }}
      />
    </>
  );
}
