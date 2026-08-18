"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BackLink } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { useToast } from "@/components/admin/Toast";
import { saveEvent, removeRsvp, createEventEmailDraft } from "./actions";
import type { EventRow, EventRsvp, RsvpCounts } from "@/lib/events";
import { toEtLocalInput } from "@/lib/event-time";
import {
  EVENT_THEMES,
  eventPalette,
  seasonalMonthName,
  type EventTheme,
} from "@/lib/event-theme";

/* ------------------------------------------------------------------ */

const LABEL = "text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint";
const FIELD =
  "w-full rounded-[9px] border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/25";
const FIELD_LABEL = "mb-1 block text-[11.5px] font-semibold text-ink-soft";

const THEME_SWATCH: Record<EventTheme, string> = {
  classic: "linear-gradient(135deg,#017391 55%,#01a7ce)",
  festive: "linear-gradient(135deg,#e85d75 55%,#f7b32b)",
  seasonal: "linear-gradient(135deg,#b0722a 55%,#f2e1c9)",
  garden: "linear-gradient(135deg,#24a332 55%,#8fd096)",
  elegant: "linear-gradient(135deg,#123a44 55%,#b7791f)",
};

function RailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-line px-5 py-4">
      <div className={`${LABEL} mb-3`}>{title}</div>
      {children}
    </div>
  );
}

/** Friendly "Fri, Sep 26 at 3:00pm" from date + time inputs (preview only). */
function friendlyWhen(date: string, time: string): string {
  if (!date) return "Date and time to be set";
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const day = dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (!time) return day;
  const [hh, mm] = time.split(":").map(Number);
  const ampm = hh >= 12 ? "pm" : "am";
  const h12 = ((hh + 11) % 12) + 1;
  return `${day} at ${h12}:${String(mm ?? 0).padStart(2, "0")}${ampm}`;
}

const RESP_BADGE: Record<string, { label: string; bg: string; col: string }> = {
  yes: { label: "Coming", bg: "rgba(36,163,50,.12)", col: "#1c7f27" },
  maybe: { label: "Maybe", bg: "rgba(183,121,31,.12)", col: "#8a6217" },
  no: { label: "Can't", bg: "#eef2f3", col: "#626d70" },
};

/* ------------------------------------------------------------------ */

export default function EventStudio({
  event,
  rsvps,
  counts,
  rsvpUrl,
  aiEnabled,
}: {
  event?: EventRow | null;
  rsvps: EventRsvp[];
  counts: RsvpCounts;
  rsvpUrl: string;
  aiEnabled: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const created = !!event;
  const startLocal = toEtLocalInput(event?.starts_at ?? null); // "YYYY-MM-DDTHH:MM"
  const [id] = useState(event?.id);
  const [endsLocal] = useState(toEtLocalInput(event?.ends_at ?? null));

  const [brief, setBrief] = useState("");
  const [planning, setPlanning] = useState(false);
  const [descBusy, setDescBusy] = useState(false);

  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(startLocal ? startLocal.slice(0, 10) : "");
  const [time, setTime] = useState(startLocal ? startLocal.slice(11, 16) : "");
  const [location, setLocation] = useState(
    event?.location ?? "Joy Senior Living, Loganville"
  );
  const [capacity, setCapacity] = useState(
    event?.capacity != null ? String(event.capacity) : ""
  );
  const [description, setDescription] = useState(event?.description ?? "");
  const [theme, setTheme] = useState<EventTheme>(
    (event?.theme as EventTheme) || "classic"
  );
  const [isPotluck, setIsPotluck] = useState(event?.is_potluck ?? false);
  const [potluckAsk, setPotluckAsk] = useState(event?.potluck_ask ?? "");

  const [copied, setCopied] = useState(false);
  const [saving, start] = useTransition();

  const pal = eventPalette(theme);

  function startsAtLocal(): string {
    if (!date) return "";
    return time ? `${date}T${time}` : `${date}T00:00`;
  }

  function payload(status: EventRow["status"]) {
    return {
      id,
      title,
      description,
      location,
      startsAt: startsAtLocal(),
      endsAt: endsLocal,
      capacity: capacity === "" ? undefined : Number(capacity),
      status,
      theme,
      isPotluck,
      potluckAsk,
    };
  }

  function persist(status: EventRow["status"], msg: string, goDetail = false) {
    if (!title.trim()) {
      toast.error("Give the event a title first.");
      return;
    }
    start(async () => {
      const res = await saveEvent(payload(status));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(msg);
      if (goDetail && !created) router.replace(`/admin/events/${res.id}`);
      else router.refresh();
    });
  }

  /* --- AI plan it --- */
  async function planIt() {
    if (!aiEnabled) {
      toast.error("AI is not set up yet (ANTHROPIC_API_KEY).");
      return;
    }
    if (!brief.trim()) {
      toast.error("Tell the AI what you're planning first.");
      return;
    }
    setPlanning(true);
    try {
      const res = await fetch("/api/admin/draft-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "plan", brief }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Planning failed.");
      const p = data.plan;
      if (p.title) setTitle(p.title);
      if (p.startsAtLocal) {
        setDate(p.startsAtLocal.slice(0, 10));
        setTime(p.startsAtLocal.slice(11, 16));
      }
      if (p.location) setLocation(p.location);
      if (p.capacity) setCapacity(String(p.capacity));
      if (p.description) setDescription(p.description);
      if (p.isPotluck) {
        setIsPotluck(true);
        if (p.potluckAsk) setPotluckAsk(p.potluckAsk);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Planning failed.");
    } finally {
      setPlanning(false);
    }
  }

  /* --- AI write description --- */
  async function writeDescription() {
    if (!aiEnabled) {
      toast.error("AI is not set up yet (ANTHROPIC_API_KEY).");
      return;
    }
    if (!title.trim()) {
      toast.error("Add a title first.");
      return;
    }
    setDescBusy(true);
    try {
      const res = await fetch("/api/admin/draft-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "description",
          title,
          whenText: friendlyWhen(date, time),
          where: location,
          isPotluck,
          potluckAsk,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Draft failed.");
      if (data.description) setDescription(data.description);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Draft failed.");
    } finally {
      setDescBusy(false);
    }
  }

  function compose(kind: "invite" | "reminder" | "update") {
    if (!id) return;
    start(async () => {
      const res = await createEventEmailDraft({ eventId: id, kind });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.push(`/admin/emails/${res.id}`);
    });
  }

  const previewWhen = friendlyWhen(date, time);
  const capNum = capacity === "" ? 0 : Number(capacity);

  return (
    <div className="fixed inset-x-0 bottom-0 top-14 z-20 overflow-auto bg-paper lg:left-60 lg:top-0">
      <div className="mx-auto min-w-[1160px] max-w-[1520px]">
        <div className="grid grid-cols-[300px_minmax(0,1fr)_284px]">
          {/* ---------- LEFT: the plan ---------- */}
          <aside className="min-h-screen border-r border-line bg-white">
            <div className="px-5 pt-5">
              <BackLink href="/admin/events">All events</BackLink>
              <h1 className="mt-2 font-display text-[22px] font-semibold text-ink">
                {created ? title || "Event" : "New event"}
              </h1>
              <p className="mt-0.5 text-xs text-ink-faint">
                {created
                  ? event!.status === "cancelled"
                    ? "Cancelled"
                    : "Published · invites can go out"
                  : "Not created yet · nothing is public"}
              </p>
            </div>

            <div className="mt-4">
              {!created && (
                <RailSection title="What are you planning?">
                  <textarea
                    className={`${FIELD} min-h-[80px] resize-y`}
                    placeholder="e.g. Fall porch social for families, last Friday of September at 3pm, coffee and pie, maybe 30 people"
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={planIt}
                    disabled={planning}
                    className="mt-2 w-full rounded-[10px] bg-clay px-3 py-2.5 text-sm font-bold text-white shadow-[0_2px_6px_rgba(1,167,206,0.35)] hover:opacity-95 disabled:opacity-60"
                  >
                    {planning ? "Planning…" : "✦ Plan it for me"}
                  </button>
                  <p className="mt-1.5 text-center text-[11px] text-ink-faint">
                    Fills in the details below. You can change anything.
                  </p>
                </RailSection>
              )}

              <RailSection title="The details">
                <label className="mb-3 block">
                  <span className={FIELD_LABEL}>Event title</span>
                  <input
                    className={FIELD}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Fall Porch Social"
                  />
                </label>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className={FIELD_LABEL}>Date (ET)</span>
                    <input
                      type="date"
                      className={FIELD}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className={FIELD_LABEL}>Time</span>
                    <input
                      type="time"
                      className={FIELD}
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </label>
                </div>
                <label className="mb-3 block">
                  <span className={FIELD_LABEL}>Where</span>
                  <input
                    className={FIELD}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </label>
                <label className="mb-3 block">
                  <span className={FIELD_LABEL}>Room for (optional)</span>
                  <input
                    type="number"
                    min={0}
                    className={FIELD}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="Leave blank for no limit"
                  />
                </label>

                <div className="mb-3">
                  <span className={FIELD_LABEL}>Is this a potluck?</span>
                  <div className="mt-1 flex gap-4">
                    {[
                      { on: isPotluck, set: () => setIsPotluck(true), label: "Yes, potluck" },
                      { on: !isPotluck, set: () => setIsPotluck(false), label: "No" },
                    ].map((o) => (
                      <button
                        key={o.label}
                        type="button"
                        onClick={o.set}
                        className="flex items-center gap-2 text-sm text-ink"
                      >
                        <span
                          className="inline-block h-4 w-4 rounded-full border"
                          style={
                            o.on
                              ? {
                                  borderColor: "#01a7ce",
                                  borderWidth: 5,
                                  boxShadow: "0 0 0 2px rgba(1,167,206,.15)",
                                }
                              : { borderColor: "#cfd8db", borderWidth: 1.5 }
                          }
                        />
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {isPotluck && (
                  <label className="mb-3 block">
                    <span className={FIELD_LABEL}>What should folks bring?</span>
                    <input
                      className={FIELD}
                      value={potluckAsk}
                      onChange={(e) => setPotluckAsk(e.target.value)}
                      placeholder="e.g. a side or dessert to share, we'll have the main dish"
                    />
                    <span className="mt-1 block text-[11px] text-ink-faint">
                      Shows on the RSVP page, and guests can say what they&apos;re bringing.
                    </span>
                  </label>
                )}

                <label className="block">
                  <span className={FIELD_LABEL}>What to expect</span>
                  <textarea
                    className={`${FIELD} min-h-[72px] resize-y`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Shown on the invite and RSVP page."
                  />
                  <button
                    type="button"
                    onClick={writeDescription}
                    disabled={descBusy}
                    className="mt-1 text-xs font-semibold text-clay-dark hover:underline disabled:opacity-50"
                  >
                    {descBusy ? "Writing…" : "✦ Write this for me"}
                  </button>
                </label>
              </RailSection>

              <div className="px-5 py-4">
                {created ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => persist(event!.status === "cancelled" ? "published" : event!.status, "Changes saved.")}
                      disabled={saving}
                      className="w-full rounded-[10px] bg-ink px-3 py-2.5 text-sm font-bold text-white hover:opacity-95 disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                    {event!.status !== "cancelled" && (
                      <ConfirmButton
                        variant="secondary"
                        size="sm"
                        title="Cancel this event?"
                        message="The RSVP page will show it as cancelled. RSVPs are kept."
                        confirmLabel="Cancel event"
                        onConfirm={() => persist("cancelled", "Event cancelled.")}
                      >
                        Cancel this event…
                      </ConfirmButton>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => persist("published", "Event created.", true)}
                    disabled={saving}
                    className="w-full rounded-[10px] bg-ink px-3 py-2.5 text-sm font-bold text-white hover:opacity-95 disabled:opacity-60"
                  >
                    {saving ? "Creating…" : "Create event"}
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* ---------- CENTER: RSVP preview ---------- */}
          <main className="flex min-h-screen flex-col">
            <div className="flex items-center gap-3 border-b border-line bg-white px-6 py-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-faint">
                The RSVP page families will see
              </span>
              {created && (
                <>
                  <span className="truncate rounded-md bg-surface px-2 py-1 font-mono text-xs text-ink-soft">
                    {rsvpUrl}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(rsvpUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      } catch {
                        /* clipboard blocked */
                      }
                    }}
                    className="whitespace-nowrap text-xs font-semibold text-clay-dark hover:underline"
                  >
                    {copied ? "Copied ✓" : "Copy link"}
                  </button>
                </>
              )}
              <div className="ml-auto">
                {created && (
                  <button
                    type="button"
                    onClick={() => compose("invite")}
                    disabled={saving}
                    className="whitespace-nowrap rounded-[10px] bg-clay px-4 py-1.5 text-sm font-bold text-white shadow-[0_2px_6px_rgba(1,167,206,0.35)] hover:opacity-95 disabled:opacity-60"
                  >
                    Send the invite →
                  </button>
                )}
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto px-6 py-8"
              style={{ background: "radial-gradient(circle at 50% 0%, #f2f5f6, #e8ecee)" }}
            >
              <p className="mx-auto mb-3 max-w-[480px] text-center text-xs text-ink-faint">
                Updates live as you edit. Anyone with the link can respond, no login
                needed.
              </p>
              <div className="mx-auto max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(7,20,23,0.12)]">
                <div className="px-6 py-7 text-center" style={{ background: pal.hero }}>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: pal.soft }}
                  >
                    {pal.eyebrow}
                  </p>
                  <h2 className="mt-1.5 font-display text-[26px] font-semibold text-white">
                    {title || "Your event title"}
                  </h2>
                  <p className="mt-2 text-sm" style={{ color: pal.soft }}>
                    {previewWhen} · {location || "Location"}
                  </p>
                </div>
                <div className="px-6 py-6">
                  <p className="font-serif text-[15px] leading-relaxed text-ink-soft" style={{ fontFamily: "Georgia, serif" }}>
                    {description ||
                      "A few warm lines about what to expect go here. Write them on the left, or let the studio draft them for you."}
                  </p>
                  {capNum > 0 && (
                    <p className="mt-2 text-xs text-ink-faint">
                      Room for {capNum} (RSVPs close when it fills up).
                    </p>
                  )}
                  {isPotluck && (
                    <div
                      className="mt-4 rounded-xl border px-4 py-3"
                      style={{ background: pal.cardBg, borderColor: pal.cardBorder }}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-soft">
                        🍲 It&apos;s a potluck
                      </p>
                      <p className="mt-1 text-sm text-ink" style={{ fontFamily: "Georgia, serif" }}>
                        {potluckAsk ||
                          "Bring a dish to share if you'd like (there will be plenty either way)."}
                      </p>
                    </div>
                  )}
                  <div className="mt-5">
                    <p className="text-sm font-bold text-ink">Will you join us?</p>
                    <div className="mt-2 flex gap-2">
                      <div
                        className="flex-1 rounded-lg border py-2.5 text-center text-sm font-bold text-white"
                        style={{ background: pal.cta, borderColor: pal.cta }}
                      >
                        Yes! 🎉
                      </div>
                      <div className="flex-1 rounded-lg border border-line py-2.5 text-center text-sm font-semibold text-ink-soft">
                        Maybe
                      </div>
                      <div className="flex-1 rounded-lg border border-line py-2.5 text-center text-sm font-semibold text-ink-soft">
                        Can&apos;t make it
                      </div>
                    </div>
                    <div className="mt-2 rounded-lg border border-line px-3 py-2.5 text-sm text-ink-faint">
                      Your name
                    </div>
                    {isPotluck && (
                      <div className="mt-2 rounded-lg border border-line px-3 py-2.5 text-sm text-ink-faint">
                        What are you bringing? (optional)
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <div className="flex-1 rounded-lg border border-line px-3 py-2.5 text-sm text-ink-faint">
                        Extra guests
                      </div>
                      <div className="flex-[1.4] rounded-lg border border-line px-3 py-2.5 text-sm text-ink-faint">
                        Email (for a reminder)
                      </div>
                    </div>
                    <div
                      className="mt-2 rounded-lg py-2.5 text-center text-sm font-bold text-white"
                      style={{ background: pal.cta }}
                    >
                      Send my RSVP
                    </div>
                  </div>
                </div>
                <div className="border-t border-line px-6 py-3 text-center text-[10.5px] text-ink-faint">
                  💙 Joy Senior Living · Loganville, GA
                </div>
              </div>
            </div>
          </main>

          {/* ---------- RIGHT: look & feel + who's coming ---------- */}
          <aside className="min-h-screen border-l border-line bg-white">
            <RailSection title="Look & feel">
              <div className="grid grid-cols-2 gap-2">
                {EVENT_THEMES.map((t) => {
                  const on = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`rounded-[10px] border p-2 text-left transition-colors ${
                        on
                          ? "border-2 border-clay shadow-[0_0_0_3px_rgba(1,167,206,0.12)]"
                          : "border border-line hover:bg-paper"
                      }`}
                    >
                      <span
                        className="mb-1.5 block h-[30px] w-full rounded-md"
                        style={{ background: THEME_SWATCH[t.id] }}
                      />
                      <span className="text-[11px] font-semibold text-ink">
                        {t.id === "seasonal" ? `Seasonal · ${seasonalMonthName()}` : t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-ink-faint">
                Styles the RSVP page and the invite email to match. Seasonal rotates
                with the month on its own.
              </p>
            </RailSection>

            {!created ? (
              <RailSection title="What happens next">
                <ol className="space-y-3">
                  {[
                    "Create the event, and it gets its own RSVP page and link.",
                    "Send the invite, which opens the email studio with everything filled in.",
                    "Watch RSVPs land here, with a reminder email a few days before.",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-surface text-[11px] font-bold text-ink-soft">
                        {i + 1}
                      </span>
                      <span className="text-[12.5px] leading-snug text-ink-soft">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </RailSection>
            ) : (
              <>
                <RailSection title="Who's coming">
                  <div className="grid grid-cols-2 gap-2">
                    <Stat value={counts.headcount} label="headcount" color="#1c7f27" />
                    <Stat value={counts.yes} label="said yes" color="#071417" />
                    <Stat value={counts.maybe} label="maybe" color="#b7791f" />
                    <Stat value={counts.no} label="can't make it" color="#97a0a3" />
                  </div>
                  {capNum > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                        <div
                          className="h-full rounded-full bg-sage"
                          style={{
                            width: `${Math.min(100, Math.round((counts.headcount / capNum) * 100))}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-ink-faint">
                        {counts.headcount} of {capNum} spots spoken for
                      </p>
                    </div>
                  )}
                  <div className="mt-3">
                    {rsvps.length === 0 ? (
                      <p className="text-xs text-ink-faint">
                        No RSVPs yet. Responses appear here as families reply.
                      </p>
                    ) : (
                      rsvps.map((r) => {
                        const b = RESP_BADGE[r.response] ?? RESP_BADGE.no;
                        const detail = r.bringing || r.note;
                        return (
                          <div
                            key={r.id}
                            className="flex items-center justify-between gap-2 border-b border-line py-2"
                          >
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-ink">
                                {r.name}
                                {r.response === "yes" && r.guests > 0 ? (
                                  <span className="text-ink-faint"> +{r.guests}</span>
                                ) : null}
                              </div>
                              {detail && (
                                <div className="truncate text-[11.5px] text-ink-faint">
                                  {r.bringing ? `Bringing: ${r.bringing}` : `“${r.note}”`}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-none items-center gap-1.5">
                              <span
                                className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                                style={{ background: b.bg, color: b.col }}
                              >
                                {b.label}
                              </span>
                              <RemoveRsvp id={r.id} onDone={() => router.refresh()} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </RailSection>

                <RailSection title="Emails for this event">
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => compose("invite")}
                      disabled={saving}
                      className="w-full rounded-[9px] border border-line bg-white py-2 text-sm font-semibold text-ink hover:bg-paper disabled:opacity-50"
                    >
                      ✉️ Send the invite
                    </button>
                    <button
                      type="button"
                      onClick={() => compose("reminder")}
                      disabled={saving}
                      className="w-full rounded-[9px] border border-line bg-white py-2 text-sm font-semibold text-ink hover:bg-paper disabled:opacity-50"
                    >
                      ⏰ Send a reminder
                    </button>
                    <button
                      type="button"
                      onClick={() => compose("update")}
                      disabled={saving}
                      className="w-full rounded-[9px] border border-line bg-white py-2 text-sm font-semibold text-ink-soft hover:bg-paper disabled:opacity-50"
                    >
                      Send an update
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-ink-faint">
                    Each opens the email studio with the event linked and a draft
                    written. You review before anything sends.
                  </p>
                </RailSection>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-[10px] border border-line px-3 py-2.5">
      <div className="text-xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-[11px] text-ink-faint">{label}</div>
    </div>
  );
}

function RemoveRsvp({ id, onDone }: { id: string; onDone: () => void }) {
  const toast = useToast();
  return (
    <ConfirmButton
      variant="ghost"
      size="sm"
      title="Remove this RSVP?"
      message="This deletes their response. They can RSVP again from the link."
      confirmLabel="Remove"
      onConfirm={async () => {
        const res = await removeRsvp(id);
        if (res.ok) {
          toast.success("RSVP removed.");
          onDone();
        } else {
          toast.error("Could not remove it.");
        }
      }}
    >
      ✕
    </ConfirmButton>
  );
}
