import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BUSINESS, MEMORY_CARE, MEMORY_CARE_EDUCATION, OG_IMAGE } from "@/lib/site";
import { getSettings } from "@/lib/settings";
import TourButton from "@/components/TourButton";
import StepTimeline from "@/components/StepTimeline";
import Accordion from "@/components/Accordion";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // No brand here: the root layout's title template appends "| Joy Senior
  // Living" automatically, so including it would double-brand the tab title.
  title: "Memory Care in Loganville, GA",
  description:
    "Memory care at Joy Senior Living in Loganville, GA, offered within our personal care home: a small, familiar setting with steady routines and staff who know your parent by name. What dementia behaviors mean, and how a small home helps.",
  alternates: { canonical: "/memory-care" },
  openGraph: {
    title: `Memory Care | ${BUSINESS.name}`,
    description: BUSINESS.descriptor,
    url: "/memory-care",
    type: "website",
    images: [OG_IMAGE],
  },
};

export default async function MemoryCarePage() {
  // §4: the page only exists while memory care is confirmed within the license.
  if (!MEMORY_CARE.enabled) notFound();

  const settings = await getSettings();

  return (
    <div className="prose-joy mx-auto max-w-2xl px-5 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-clay">
        Memory care, within our personal care home
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-ink sm:text-5xl">
        {MEMORY_CARE.heading}
      </h1>

      <div className="mt-6 space-y-5 text-lg leading-relaxed text-ink-soft">
        {MEMORY_CARE.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {/* Visual: the steady day. Routine is the therapy, so we show it. */}
      <StepTimeline
        heading={MEMORY_CARE_EDUCATION.rhythmHeading}
        lede={MEMORY_CARE_EDUCATION.rhythmLede}
        steps={MEMORY_CARE_EDUCATION.rhythm.map((s) => ({
          label: s.label,
          body: s.body,
        }))}
      />

      {/* Interactive, educational guide to what families see. */}
      <Accordion
        idPrefix="signs"
        heading={MEMORY_CARE_EDUCATION.signsHeading}
        lede={MEMORY_CARE_EDUCATION.signsLede}
        items={MEMORY_CARE_EDUCATION.signs.map((s) => ({
          title: s.title,
          body: s.body,
        }))}
      />

      {/* Single tour CTA (§: one tour path only). */}
      <div className="mt-16 rounded-2xl bg-ink px-6 py-8 text-center text-white">
        <p className="font-display text-2xl font-semibold">
          Talk it through with {BUSINESS.director.name.split(" ")[0]}
        </p>
        <p className="mx-auto mt-2 max-w-md text-white/80">
          {BUSINESS.director.name} can walk you through what memory care at Joy
          would look like for your parent, and tell you honestly whether it is
          the right fit. Book a tour, or call {settings.phone}.
        </p>
        <div className="mt-5">
          <TourButton variant="light" href={settings.talkfurther_url}>
            {MEMORY_CARE.ctaLabel}
          </TourButton>
        </div>
      </div>

      <p className="mt-10 text-base leading-relaxed text-ink-faint">
        Looking at all of Joy&rsquo;s care?{" "}
        <Link
          href="/services"
          className="font-semibold text-clay hover:text-clay-dark"
        >
          See everything we offer
        </Link>
        .
      </p>
    </div>
  );
}
