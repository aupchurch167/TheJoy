import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasDatabase } from "@/lib/db";
import { getEventByToken } from "@/lib/events";
import { formatEventWhenLong } from "@/lib/event-time";
import { eventPalette } from "@/lib/event-theme";
import { BUSINESS } from "@/lib/site";
import RsvpForm from "./RsvpForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "RSVP",
  robots: { index: false, follow: false },
};

export default async function RsvpPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!hasDatabase()) notFound();

  const event = await getEventByToken(token);
  if (!event) notFound();

  const cancelled = event.status === "cancelled";
  const pal = eventPalette(event.theme);
  const potluckAsk =
    event.potluck_ask?.trim() ||
    "Bring a dish to share if you'd like (there will be plenty either way).";

  return (
    <main className="min-h-screen bg-paper px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-xl">
        <p className="text-center font-display text-lg font-semibold text-ink">
          {BUSINESS.name}
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="px-6 py-7 text-center" style={{ backgroundColor: pal.hero }}>
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: pal.soft }}
            >
              {pal.eyebrow}
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-semibold text-white">
              {event.title}
            </h1>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm font-medium text-ink">
              🗓️ {formatEventWhenLong(event.starts_at)}
            </p>
            {event.location && (
              <p className="mt-1 text-sm text-ink-soft">📍 {event.location}</p>
            )}
            {event.capacity != null && event.capacity > 0 && (
              <p className="mt-1 text-sm text-ink-faint">
                Room for {event.capacity} (RSVPs close when it fills up).
              </p>
            )}
            {event.body_heading?.trim() && (
              <h2 className="mt-4 font-display text-lg font-semibold text-ink">
                {event.body_heading}
              </h2>
            )}
            {event.description.trim() && (
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">
                {event.description}
              </p>
            )}
            {event.what_to_expect?.trim() && (
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-faint">
                  What to expect
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">
                  {event.what_to_expect}
                </p>
              </div>
            )}
            {event.is_potluck && (
              <div
                className="mt-4 rounded-xl border px-4 py-3"
                style={{ backgroundColor: pal.cardBg, borderColor: pal.cardBorder }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-soft">
                  🍲 It&apos;s a potluck
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink">{potluckAsk}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          {cancelled ? (
            <div className="rounded-xl border border-line bg-white p-6 text-center text-ink-soft shadow-sm">
              This event has been cancelled. Please reach out to {BUSINESS.name} with
              any questions.
            </div>
          ) : (
            <RsvpForm
              token={event.rsvp_token}
              accent={pal.cta}
              isPotluck={event.is_potluck}
            />
          )}
        </div>

        {event.closing_note?.trim() && (
          <div className="mt-6 rounded-xl border border-line bg-white px-5 py-4 text-[14px] leading-relaxed text-ink-soft shadow-sm">
            <p className="whitespace-pre-wrap">{event.closing_note}</p>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-ink-faint">
          {BUSINESS.name}, a personal care home in {BUSINESS.address.city},{" "}
          {BUSINESS.address.state}.
        </p>
      </div>
    </main>
  );
}
