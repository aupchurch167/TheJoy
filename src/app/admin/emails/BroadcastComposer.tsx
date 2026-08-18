"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";
import {
  saveDraft,
  sendOrSchedule,
  removeBroadcast,
  sendTest,
  previewRecipients,
  duplicateBroadcast,
  saveSegment,
  removeSegment,
  resendToNonOpeners,
} from "./actions";
import type {
  Broadcast,
  BroadcastResults,
  SavedSegment,
} from "@/lib/broadcasts";
import type { Audience } from "@/lib/leads";
import { templatesForAudience } from "@/lib/email-templates";
import { EMAIL_DESIGNS } from "@/lib/email-designs";
import { btn, BackLink, Badge, Card } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { useToast } from "@/components/admin/Toast";
import { formatDateTime, formatSource } from "@/lib/format";

const INPUT =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30";

const AUDIENCE_LABEL: Record<Audience, string> = {
  leads: "all subscribed leads (families researching Joy)",
  families: "the family list (current residents' families)",
};

const STAGES: { key: string; label: string }[] = [
  { key: "new", label: "New" },
  { key: "toured", label: "Toured" },
  { key: "moved_in", label: "Moved in" },
  { key: "lost", label: "Lost" },
];

export default function BroadcastComposer({
  broadcast,
  sources = [],
  segments = [],
  results = null,
  resendInfo = null,
}: {
  broadcast?: Broadcast | null;
  sources?: string[];
  segments?: SavedSegment[];
  results?: BroadcastResults | null;
  resendInfo?: { parentSubject: string; count: number } | null;
}) {
  const isResend = !!resendInfo;
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [id, setId] = useState<string | undefined>(broadcast?.id);
  const [audience, setAudience] = useState<Audience>(
    broadcast?.audience ?? "leads"
  );
  const [subject, setSubject] = useState(broadcast?.subject ?? "");
  const [body, setBody] = useState(broadcast?.body ?? "");
  // 'markdown' = letter templates; 'html' = designed inner HTML (wrapped in the
  // Joy shell); 'html_standalone' = a complete design with its own header/footer.
  const [format, setFormat] = useState<"markdown" | "html" | "html_standalone">(
    broadcast?.body_format ?? "markdown"
  );
  const isStandalone = format === "html_standalone";
  const isHtml = format === "html" || isStandalone;
  const [when, setWhen] = useState("");

  // Recipient segment (drill into the leads audience).
  const f0 = broadcast?.filters ?? null;
  const [fSources, setFSources] = useState<string[]>(f0?.sources ?? []);
  const [fStages, setFStages] = useState<string[]>(f0?.stages ?? []);
  const [fFrom, setFFrom] = useState<string>(f0?.createdFrom?.slice(0, 10) ?? "");
  const [fTo, setFTo] = useState<string>(f0?.createdTo?.slice(0, 10) ?? "");
  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);

  // Build the filter payload; only the leads audience is segmentable.
  const currentFilters =
    audience === "leads"
      ? {
          sources: fSources,
          stages: fStages,
          createdFrom: fFrom || undefined,
          createdTo: fTo || undefined,
        }
      : undefined;
  const hasFilter =
    audience === "leads" &&
    (fSources.length > 0 || fStages.length > 0 || !!fFrom || !!fTo);

  function toggle(list: string[], set: (v: string[]) => void, val: string) {
    set(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  }
  function clearFilters() {
    setFSources([]);
    setFStages([]);
    setFFrom("");
    setFTo("");
  }

  // Saved segments (load / save / delete).
  const [savedSegments, setSavedSegments] = useState<SavedSegment[]>(segments);

  function loadSegment(segId: string) {
    const seg = savedSegments.find((s) => s.id === segId);
    if (!seg) return;
    setFSources(seg.filters.sources ?? []);
    setFStages(seg.filters.stages ?? []);
    setFFrom(seg.filters.createdFrom?.slice(0, 10) ?? "");
    setFTo(seg.filters.createdTo?.slice(0, 10) ?? "");
    success(`Loaded segment: ${seg.name}`);
  }

  function onSaveSegment() {
    const name = window.prompt("Name this segment (e.g. “Facebook, still new”):");
    if (!name?.trim()) return;
    start(async () => {
      const res = await saveSegment({
        name: name.trim(),
        audience,
        filters: currentFilters,
      });
      if (!res.ok) {
        toastError(res.error);
        return;
      }
      setSavedSegments((list) =>
        [...list, res.segment].sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        )
      );
      success(`Saved segment: ${res.segment.name}`);
    });
  }

  function onDeleteSegment(segId: string) {
    const seg = savedSegments.find((s) => s.id === segId);
    if (!seg || !window.confirm(`Delete the saved segment “${seg.name}”?`)) return;
    start(async () => {
      const res = await removeSegment(segId);
      if (!res.ok) {
        toastError("Could not delete the segment.");
        return;
      }
      setSavedSegments((list) => list.filter((s) => s.id !== segId));
      success("Segment deleted.");
    });
  }

  function onDuplicate() {
    if (!broadcast?.id) return;
    start(async () => {
      const res = await duplicateBroadcast(broadcast.id);
      if (!res.ok) {
        toastError("Could not duplicate this email.");
        return;
      }
      success("Duplicated as a new draft.");
      router.push(`/admin/emails/${res.id}`);
    });
  }

  function onResend() {
    if (!broadcast?.id) return;
    start(async () => {
      const res = await resendToNonOpeners(broadcast.id);
      if (!res.ok) {
        toastError(res.error);
        return;
      }
      success("Draft ready. Give it a fresh subject, then send.");
      router.push(`/admin/emails/${res.id}`);
    });
  }

  // Live recipient count as audience/filters change (debounced). A resend has a
  // fixed non-opener count, so skip the segment count there.
  useEffect(() => {
    if (isResend) return;
    let cancelled = false;
    const filters =
      audience === "leads"
        ? { sources: fSources, stages: fStages, createdFrom: fFrom || undefined, createdTo: fTo || undefined }
        : undefined;
    const t = setTimeout(async () => {
      setCounting(true);
      const n = await previewRecipients({ audience, filters });
      if (!cancelled) {
        setCount(n);
        setCounting(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [isResend, audience, fSources, fStages, fFrom, fTo]);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // "Create with AI" panel.
  const [aiContext, setAiContext] = useState("");
  const [aiStyle, setAiStyle] = useState("standard");
  // Designed-HTML mode: Claude builds a richer, festive HTML email.
  const [aiDesign, setAiDesign] = useState(false);
  const [aiOccasion, setAiOccasion] = useState("birthday");
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
      const res = await saveDraft({ id, subject, body, format, audience, filters: currentFilters });
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
          format,
          audience,
          filters: currentFilters,
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

  function applyDesign(designId: string) {
    const d = EMAIL_DESIGNS.find((x) => x.id === designId);
    if (!d) return;
    if (
      (subject.trim() || body.trim()) &&
      !window.confirm("Replace the current subject and message with this design?")
    ) {
      return;
    }
    setSubject(d.subject);
    setBody(d.html);
    setFormat(d.format);
    setTab("preview");
    success(`Loaded design: ${d.label}. Fill in the [placeholders], then Send test.`);
  }

  function applyTemplate(templateId: string) {
    const t = templatesForAudience(audience).find((x) => x.id === templateId);
    if (!t) return;
    if (
      (subject.trim() || body.trim()) &&
      !window.confirm(
        "Replace the current subject and message with this template?"
      )
    ) {
      return;
    }
    setSubject(t.subject);
    setBody(t.body);
    setFormat("markdown");
    setTab("write");
    success(`Loaded template: ${t.label}`);
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
      const res = await sendTest({ subject, body, format, to: testTo });
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
      if (aiDesign) {
        // Designed HTML: Claude builds a festive, email-safe HTML email.
        const res = await fetch("/api/admin/design-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context: aiContext, audience, occasion: aiOccasion }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setAiError(json.error || "The AI design failed.");
          toastError(json.error || "The AI design failed.");
          return;
        }
        setSubject(json.draft.subject);
        setBody(json.draft.html);
        // Birthday invites are complete standalone designs (their own header +
        // footer); other occasions are wrapped in the Joy letter shell.
        setFormat(json.draft.standalone ? "html_standalone" : "html");
        setTab("preview");
        success("Designed email ready. Preview it, then Send test to see it live.");
        return;
      }
      const res = await fetch("/api/admin/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: aiContext, audience, style: aiStyle }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setAiError(json.error || "The AI draft failed.");
        toastError(json.error || "The AI draft failed.");
        return;
      }
      setSubject(json.draft.subject);
      setBody(json.draft.body);
      setFormat("markdown");
      setTab("write");
      success("AI draft ready. Review and edit before sending.");
    } catch {
      setAiError("The AI draft failed. Please try again.");
    } finally {
      setAiBusy(false);
    }
  }

  // Insert a snippet at the caret in the Message textarea (or append if the
  // textarea was never focused), then restore focus after the inserted text.
  function insertAtCursor(snippet: string) {
    const el = bodyRef.current;
    const start = el ? el.selectionStart : body.length;
    const end = el ? el.selectionEnd : body.length;
    const next = body.slice(0, start) + snippet + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      const pos = start + snippet.length;
      if (bodyRef.current) {
        bodyRef.current.focus();
        bodyRef.current.setSelectionRange(pos, pos);
      }
    });
  }

  // The insert popover (link / button) and its fields.
  const [insertKind, setInsertKind] = useState<null | "link" | "button">(null);
  const [insText, setInsText] = useState("");
  const [insUrl, setInsUrl] = useState("");

  function openInsert(kind: "link" | "button") {
    setInsertKind(kind);
    setInsText("");
    setInsUrl("");
  }

  function confirmInsert() {
    const url = insUrl.trim();
    if (!url) {
      toastError("Add a link (a web address, tel:, or mailto:).");
      return;
    }
    if (insertKind === "link") {
      insertAtCursor(`[${insText.trim() || url}](${url})`);
    } else if (insertKind === "button") {
      insertAtCursor(`\n\n[[button:${insText.trim() || "Button"}|${url}]]\n\n`);
    }
    setInsertKind(null);
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
    insertAtCursor(`\n\n![](${json.url})\n\n`);
  }

  if (sent) {
    const pct = (n: number) =>
      results && results.sent > 0
        ? ` (${Math.round((n / results.sent) * 100)}%)`
        : "";
    const stats: { label: string; value: number; suffix?: string }[] = results
      ? [
          { label: "Sent", value: results.sent },
          { label: "Delivered", value: results.delivered, suffix: pct(results.delivered) },
          { label: "Opened", value: results.opened, suffix: pct(results.opened) },
          { label: "Clicked", value: results.clicked, suffix: pct(results.clicked) },
          { label: "Bounced", value: results.bounced },
          { label: "Complaints", value: results.complained },
        ]
      : [];
    return (
      <div className="max-w-3xl">
        <BackLink href="/admin/emails">All emails</BackLink>
        <div className="mt-3 mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Email
            </h1>
            <Badge tone="success">sent</Badge>
          </div>
          <div className="flex items-center gap-2">
            {results && results.opened < results.sent && (
              <button
                onClick={onResend}
                disabled={pending}
                className={btn("secondary", "sm")}
              >
                Resend to non-openers
              </button>
            )}
            <button onClick={onDuplicate} disabled={pending} className={btn("secondary", "sm")}>
              {pending ? "Working…" : "Duplicate"}
            </button>
          </div>
        </div>

        {results && (
          <Card className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Results
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-lg border border-line bg-surface px-3 py-2.5">
                  <div className="text-xl font-semibold text-ink">
                    {s.value}
                    {s.suffix && (
                      <span className="ml-1 text-sm font-normal text-ink-faint">
                        {s.suffix}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink-faint">{s.label}</div>
                </div>
              ))}
            </div>
            {results.bounced + results.complained > 0 && (
              <p className="mt-3 text-xs text-ink-faint">
                Bounced and complained addresses are unsubscribed automatically.
              </p>
            )}
            <p className="mt-2 text-xs text-ink-faint">
              Opens and clicks update as recipients engage (via the email
              provider), so these numbers keep climbing for a while after a send.
            </p>
          </Card>
        )}

        <Card>
          <p className="font-medium text-ink">{broadcast?.subject}</p>
          <p className="mt-1 text-sm text-ink-faint">
            Sent to {broadcast?.sent_count} recipient(s)
            {broadcast?.sent_at ? ` on ${formatDateTime(broadcast.sent_at)}` : ""}{" "}
            ({AUDIENCE_LABEL[broadcast?.audience ?? "leads"]}).
          </p>
          <div className="mt-4 border-t border-line pt-4">
            {broadcast?.body_format === "html" ||
            broadcast?.body_format === "html_standalone" ? (
              <iframe
                title="Sent email"
                sandbox=""
                className="h-[32rem] w-full overflow-hidden rounded-lg border border-line bg-[#fbf9f5]"
                srcDoc={
                  broadcast?.body_format === "html_standalone"
                    ? broadcast?.body || ""
                    : `<div style="background:#fbf9f5;padding:24px;font-family:Georgia,'Times New Roman',serif;">${broadcast?.body || ""}</div>`
                }
              />
            ) : (
              <Markdown>{broadcast?.body || ""}</Markdown>
            )}
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
        {/* Resend-to-non-openers banner (replaces audience choice + segment). */}
        {isResend && resendInfo && (
          <div className="rounded-xl border border-clay/30 bg-clay/5 px-4 py-3 text-sm text-ink-soft">
            <p>
              <strong className="text-ink">Follow-up to non-openers</strong> of
              &ldquo;{resendInfo.parentSubject}&rdquo;. This will go to the{" "}
              <strong className="text-ink">{resendInfo.count}</strong> recipient
              {resendInfo.count === 1 ? "" : "s"} who have not opened it yet
              (recalculated when you send). Give it a{" "}
              <strong className="text-ink">different subject</strong> so it reads
              as a fresh note.
            </p>
          </div>
        )}

        {/* Audience */}
        {!isResend && (
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
        )}

        {!isResend && audience === "families" && (
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

        {/* Refine recipients: drill into the leads audience by source, stage, date. */}
        {!isResend && audience === "leads" && (
          <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-ink">
                Refine recipients{" "}
                <span className="text-ink-faint">(optional)</span>
              </span>
              <span
                className="rounded-full bg-clay/10 px-2.5 py-1 text-xs font-semibold text-clay"
                aria-live="polite"
              >
                {counting ? "counting…" : `${count ?? 0} recipient${count === 1 ? "" : "s"}`}
              </span>
            </div>

            {/* Saved segments: load a named filter set, or save the current one. */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) loadSegment(e.target.value);
                  e.target.value = "";
                }}
                className="h-9 rounded-lg border border-line bg-white px-2 text-sm text-ink focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30"
              >
                <option value="">Load a saved segment…</option>
                {savedSegments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onSaveSegment}
                disabled={!hasFilter || pending}
                className="h-9 rounded-lg border border-line bg-white px-3 text-xs font-semibold text-ink-soft hover:bg-surface disabled:opacity-50"
              >
                Save current
              </button>
              {savedSegments.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) onDeleteSegment(e.target.value);
                    e.target.value = "";
                  }}
                  className="h-9 rounded-lg border border-line bg-white px-2 text-xs text-ink-faint focus:border-clay focus:outline-none"
                >
                  <option value="">Delete a segment…</option>
                  {savedSegments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {sources.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-ink-soft">Source / tag</p>
                <div className="mt-1.5 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                  {sources.map((s) => {
                    const on = fSources.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggle(fSources, setFSources, s)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                          on
                            ? "border-clay bg-clay text-white"
                            : "border-line bg-white text-ink-soft hover:bg-surface"
                        }`}
                      >
                        {formatSource(s)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-3">
              <p className="text-xs font-medium text-ink-soft">Stage</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {STAGES.map((st) => {
                  const on = fStages.includes(st.key);
                  return (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => toggle(fStages, setFStages, st.key)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                        on
                          ? "border-clay bg-clay text-white"
                          : "border-line bg-white text-ink-soft hover:bg-surface"
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="text-xs font-medium text-ink-soft">
                  Added from
                </span>
                <input
                  type="date"
                  value={fFrom}
                  onChange={(e) => setFFrom(e.target.value)}
                  className="mt-1 block h-9 rounded-lg border border-line bg-white px-2 text-sm text-ink focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-ink-soft">
                  Added to
                </span>
                <input
                  type="date"
                  value={fTo}
                  onChange={(e) => setFTo(e.target.value)}
                  className="mt-1 block h-9 rounded-lg border border-line bg-white px-2 text-sm text-ink focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30"
                />
              </label>
              {hasFilter && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-9 text-xs font-medium text-ink-faint underline underline-offset-2 hover:text-clay"
                >
                  Clear filters
                </button>
              )}
            </div>

            <p className="mt-2.5 text-xs text-ink-faint">
              Leave everything unchecked to reach the whole audience. Opted-out
              recipients are always excluded from the count.
            </p>
          </div>
        )}

        {/* Start from a ready-made template (filled with merge fields). */}
        <label className="block">
          <span className="text-sm font-medium text-ink">
            Start from a template{" "}
            <span className="text-ink-faint">(optional)</span>
          </span>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) applyTemplate(e.target.value);
              e.target.value = "";
            }}
            className={`${INPUT} mt-1.5 h-11 sm:max-w-md`}
          >
            <option value="">Choose a template…</option>
            {templatesForAudience(audience).map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-ink-faint">
            Fills the subject and message. Then customize it and use{" "}
            <strong className="font-semibold">{"{{first_name}}"}</strong> anywhere
            to personalize each recipient.
          </span>
        </label>

        {/* Create with AI: describe the email, get a Joy-voice draft to edit. */}
        <div className="rounded-xl border border-clay/30 bg-clay/5 p-4">
          <p className="text-sm font-semibold text-ink">
            ✨ Create with AI
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            Describe the email and any details (event, date, the message you want
            to get across). The AI writes a draft in Joy&apos;s voice for the{" "}
            {audience === "families" ? "families" : "leads"} list, with a headline,
            buttons, and flair to match the occasion. It never sends, and it fills
            in [placeholders] for anything you did not specify.
          </p>
          <label className="mt-2.5 flex items-start gap-2.5 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={aiDesign}
              onChange={(e) => setAiDesign(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-clay"
            />
            <span>
              <strong className="text-ink">Design it in HTML</strong> for a
              richer, more special look (festive banners and color, great for
              birthdays and celebrations). Off = a clean text letter.
            </span>
          </label>

          <div className="mt-2.5">
            <label className="text-xs font-medium text-ink">
              {aiDesign ? "Occasion" : "Style / occasion"}
            </label>
            {aiDesign ? (
              <select
                value={aiOccasion}
                onChange={(e) => setAiOccasion(e.target.value)}
                className={`${INPUT} mt-1 h-10 sm:max-w-xs`}
              >
                <option value="birthday">Birthday</option>
                <option value="celebration">Celebration / milestone</option>
                <option value="event">Event invitation</option>
                <option value="holiday">Holiday / seasonal</option>
                <option value="thank_you">Thank you</option>
                <option value="announcement">Announcement / update</option>
              </select>
            ) : (
              <select
                value={aiStyle}
                onChange={(e) => setAiStyle(e.target.value)}
                className={`${INPUT} mt-1 h-10 sm:max-w-xs`}
              >
                <option value="standard">Standard note</option>
                <option value="birthday">Birthday</option>
                <option value="holiday">Holiday / seasonal</option>
                <option value="event">Event invitation</option>
                <option value="newsletter">Newsletter / update</option>
              </select>
            )}
          </div>
          {aiDesign && EMAIL_DESIGNS.length > 0 && (
            <div className="mt-2.5">
              <p className="text-xs font-medium text-ink">
                Or start from a ready-made design
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {EMAIL_DESIGNS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => applyDesign(d.id)}
                    className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface hover:text-ink"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                Loads the finished design; fill in the [placeholders] (resident,
                day, time) in the message box, then Send test.
              </p>
            </div>
          )}

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
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-ink">Message</label>
              {isHtml && (
                <>
                  <Badge tone="info">Designed HTML</Badge>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Switch to the simple text editor? The designed HTML stays in the box, but new edits use plain text formatting."
                        )
                      )
                        setFormat("markdown");
                    }}
                    className="text-xs font-medium text-ink-faint underline underline-offset-2 hover:text-clay"
                  >
                    Switch to text
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {tab === "write" && !isHtml && (
                <div className="flex items-center gap-1">
                  <ToolButton onClick={() => openInsert("link")}>Link</ToolButton>
                  <ToolButton onClick={() => openInsert("button")}>
                    Button
                  </ToolButton>
                  <ToolButton onClick={() => insertAtCursor("\n\n[[divider]]\n\n")}>
                    Divider
                  </ToolButton>
                  <PhotoButton onFile={uploadImage} />
                </div>
              )}
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

          {/* Insert link / button popover */}
          {insertKind && tab === "write" && !isHtml && (
            <div className="mb-2 rounded-lg border border-clay/30 bg-clay/5 p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
                <label className="block">
                  <span className="text-xs font-medium text-ink-soft">
                    {insertKind === "button" ? "Button label" : "Link text"}
                  </span>
                  <input
                    value={insText}
                    onChange={(e) => setInsText(e.target.value)}
                    placeholder={insertKind === "button" ? "Book a tour" : "our reviews"}
                    className={`${INPUT} mt-1 h-9`}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ink-soft">Link</span>
                  <input
                    value={insUrl}
                    onChange={(e) => setInsUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmInsert()}
                    placeholder="https://… , tel:+1…, or mailto:…"
                    className={`${INPUT} mt-1 h-9`}
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={confirmInsert}
                    className={btn("primary", "sm")}
                  >
                    Insert
                  </button>
                  <button
                    type="button"
                    onClick={() => setInsertKind(null)}
                    className={btn("ghost", "sm")}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {tab === "write" ? (
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="w-full rounded-lg border border-line bg-white px-4 py-3 font-mono text-sm leading-relaxed text-ink transition-colors focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30"
              placeholder={
                isHtml
                  ? "This is the designed HTML. Preview shows how it looks; you can hand-edit the HTML here if you like (it is wrapped in the Joy letterhead + footer on send)."
                  : "Write in Markdown. Short sentences. No em-dashes. Add photos with the Photo button. Every email includes an unsubscribe link automatically."
              }
            />
          ) : (
            <div className="min-h-[14rem] overflow-hidden rounded-lg border border-line bg-white">
              {body.trim() ? (
                isHtml ? (
                  <iframe
                    title="Email preview"
                    sandbox=""
                    className="h-[32rem] w-full border-0 bg-[#fbf9f5]"
                    srcDoc={
                      isStandalone
                        ? body
                        : `<div style="background:#fbf9f5;padding:24px;font-family:Georgia,'Times New Roman',serif;">${body}</div>`
                    }
                  />
                ) : (
                  <div className="px-6 py-6">
                    <Markdown>{body}</Markdown>
                  </div>
                )
              ) : (
                <p className="px-6 py-6 text-ink-faint">Nothing to preview yet.</p>
              )}
            </div>
          )}
          <p className="mt-2 text-xs text-ink-faint">
            {isHtml ? (
              <>
                This is a designed HTML email. The Joy letterhead, badges, and an
                unsubscribe link are added automatically (opted-out recipients are
                always skipped). Personalize with{" "}
                <code>{"{{first_name}}"}</code>. Use{" "}
                <strong className="font-semibold">Send test</strong> to see it in
                a real inbox before you send.
              </>
            ) : (
              <>
                Use the toolbar above to drop in a{" "}
                <strong className="font-semibold">Link</strong>,{" "}
                <strong className="font-semibold">Button</strong>,{" "}
                <strong className="font-semibold">Divider</strong>, or{" "}
                <strong className="font-semibold">Photo</strong> at your cursor.
                The Joy letterhead, badges, and an unsubscribe link are added
                automatically (opted-out recipients are always skipped).
                Personalize with <code>{"{{first_name}}"}</code>. Use{" "}
                <strong className="font-semibold">Send test</strong> to see the
                final design.
              </>
            )}
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
                  isResend && resendInfo ? (
                    <>
                      This sends to the {resendInfo.count} recipient
                      {resendInfo.count === 1 ? "" : "s"} who have not opened
                      &ldquo;{resendInfo.parentSubject}&rdquo;. This cannot be
                      undone.
                    </>
                  ) : (
                    <>
                      This sends to {count ?? 0} recipient
                      {count === 1 ? "" : "s"}
                      {hasFilter
                        ? " matching your filters"
                        : ` (${AUDIENCE_LABEL[audience]})`}
                      . This cannot be undone.
                    </>
                  )
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

function ToolButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface hover:text-ink"
    >
      {children}
    </button>
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
