"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";
import { saveDraft, sendOrSchedule, removeBroadcast } from "./actions";
import type { Broadcast } from "@/lib/broadcasts";
import type { Audience } from "@/lib/leads";

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
  const [id, setId] = useState<string | undefined>(broadcast?.id);
  const [audience, setAudience] = useState<Audience>(
    broadcast?.audience ?? "leads"
  );
  const [subject, setSubject] = useState(broadcast?.subject ?? "");
  const [body, setBody] = useState(broadcast?.body ?? "");
  const [when, setWhen] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const sent = broadcast?.status === "sent";
  const isNew = !broadcast;

  function run(fn: () => Promise<void>) {
    setMessage("");
    setError("");
    start(fn);
  }

  function onSaveDraft() {
    run(async () => {
      const res = await saveDraft({ id, subject, body, audience });
      if (!res.ok) return setError(res.error);
      setId(res.id);
      setMessage(res.message);
      if (isNew) router.replace(`/admin/emails/${res.id}`);
      else router.refresh();
    });
  }

  function onSend() {
    const to = AUDIENCE_LABEL[audience];
    if (!when && !confirm(`Send this email to ${to} now? This cannot be undone.`))
      return;
    run(async () => {
      const res = await sendOrSchedule({
        id,
        subject,
        body,
        audience,
        when: when || undefined,
      });
      if (!res.ok) return setError(res.error);
      setId(res.id);
      setMessage(res.message);
      router.refresh();
    });
  }

  function onDelete() {
    if (!id || !confirm("Delete this email?")) return;
    run(async () => {
      const res = await removeBroadcast(id);
      if (res.ok) router.push("/admin/emails");
      else setError("Could not delete.");
    });
  }

  async function uploadImage(file: File) {
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json.error || "Upload failed.");
      return;
    }
    setBody((b) => `${b}\n\n![](${json.url})\n`);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-8">
        <h1 className="mb-4 font-display text-2xl font-semibold text-ink">
          Email (sent)
        </h1>
        <div className="rounded-lg border border-line bg-white p-6">
          <p className="font-medium text-ink">{broadcast?.subject}</p>
          <p className="mt-1 text-sm text-ink-faint">
            Sent to {broadcast?.sent_count} recipient(s)
            {broadcast?.sent_at
              ? ` on ${new Date(broadcast.sent_at).toLocaleString()}`
              : ""}{" "}
            ({AUDIENCE_LABEL[broadcast?.audience ?? "leads"]}).
          </p>
          <div className="mt-4 border-t border-line pt-4">
            <Markdown>{broadcast?.body || ""}</Markdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold text-ink">
        {broadcast ? "Edit email" : "New email"}
      </h1>

      {(message || error) && (
        <p
          role="status"
          className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${
            error ? "bg-clay/10 text-clay-dark" : "bg-sage/15 text-sage"
          }`}
        >
          {error || message}
        </p>
      )}

      <div className="grid gap-5">
        {/* Audience */}
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Send to</span>
          {isNew ? (
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as Audience)}
              className="mt-1 block w-full rounded-lg border border-line bg-white px-4 py-2.5 text-ink outline-none focus:border-clay sm:max-w-md"
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
          <div className="rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-ink-soft">
            <strong className="text-ink">Community-wide only.</strong> Parties,
            family nights, a monthly note, event photos. Never individual
            resident details, and never anything urgent (that stays a phone call).
          </div>
        )}

        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Subject</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-white px-4 py-3 text-ink outline-none focus:border-clay"
            placeholder={
              audience === "families" ? "You're invited to Joy" : "A note from Joy"
            }
          />
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-ink-soft">Message</label>
            <div className="flex items-center gap-2">
              <PhotoButton onFile={uploadImage} />
              <div className="flex rounded-lg border border-line text-sm">
                <button
                  onClick={() => setTab("write")}
                  className={`rounded-l-lg px-3 py-1 ${tab === "write" ? "bg-clay text-white" : "text-ink-soft"}`}
                >
                  Write
                </button>
                <button
                  onClick={() => setTab("preview")}
                  className={`rounded-r-lg px-3 py-1 ${tab === "preview" ? "bg-clay text-white" : "text-ink-soft"}`}
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
              className="w-full rounded-lg border border-line bg-white px-4 py-3 font-mono text-sm leading-relaxed text-ink outline-none focus:border-clay"
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

        <div className="flex flex-wrap items-end gap-4 rounded-lg border border-line bg-white p-4">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">
              Schedule for <span className="text-ink-faint">(optional)</span>
            </span>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="mt-1 block rounded-lg border border-line bg-white px-3 py-2 text-ink outline-none focus:border-clay"
            />
          </label>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            {id && (
              <button
                onClick={onDelete}
                disabled={pending}
                className="rounded-full border border-line px-3 py-2 text-sm text-clay-dark hover:bg-clay/5"
              >
                Delete
              </button>
            )}
            <button
              onClick={onSaveDraft}
              disabled={pending}
              className="rounded-full border border-clay px-4 py-2 text-sm font-semibold text-clay hover:bg-clay/5 disabled:opacity-60"
            >
              Save draft
            </button>
            <button
              onClick={onSend}
              disabled={pending}
              className="rounded-full bg-clay px-4 py-2 text-sm font-semibold text-white hover:bg-clay-dark disabled:opacity-60"
            >
              {when ? "Schedule" : "Send now"}
            </button>
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
        className="rounded-lg border border-line bg-paper px-3 py-1 text-sm font-medium text-ink-soft hover:bg-white disabled:opacity-60"
      >
        {busy ? "Uploading..." : "Photo"}
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
