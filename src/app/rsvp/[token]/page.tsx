import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasDatabase } from "@/lib/db";
import { getEventByToken } from "@/lib/events";
import { formatEventWhenLong } from "@/lib/event-time";
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

  return (
    <main className="min-h-screen bg-paper px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-xl">
        <p className="text-center font-display text-lg font-semibold text-ink">
          {BUSINESS.name}
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="bg-clay px-6 py-7 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
              You&apos;re invited
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
            {event.description.trim() && (
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">
                {event.description}
              </p>
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
            <RsvpForm token={event.rsvp_token} />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-ink-faint">
          {BUSINESS.name}, a personal care home in {BUSINESS.address.city},{" "}
          {BUSINESS.address.state}.
        </p>
      </div>
    </main>
  );
}
