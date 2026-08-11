import type { Metadata } from "next";
import { BUSINESS, OG_IMAGE } from "@/lib/site";
import {
  WHEN_TUESDAY,
  WHEN_SIGNS_LEDE,
  WHEN_SIGNS,
  WHEN_TURN,
  WHEN_QUOTE,
  WHEN_FAQ,
} from "@/lib/landing";
import Accordion from "@/components/Accordion";
import CtaBand from "@/components/landing/CtaBand";
import ProofPulse from "@/components/landing/ProofPulse";
import FamilyQuote from "@/components/landing/FamilyQuote";
import EssayRows from "@/components/landing/EssayRows";

export const metadata: Metadata = {
  title: "Is it time? The signs families notice",
  description:
    "The quiet signs that a parent may need more help, what they mean, and why noticing is not betrayal. Joy is a small personal care home in Loganville, GA.",
  alternates: { canonical: "/when-its-time" },
  openGraph: {
    title: `Is it time? | ${BUSINESS.name}`,
    description: BUSINESS.descriptor,
    url: "/when-its-time",
    type: "website",
    images: [OG_IMAGE],
  },
};

export default function WhenItsTimePage() {
  return (
    <>
      {/* Hero: headline alone, with air */}
      <section className="mx-auto max-w-2xl px-5 pt-16 pb-10 sm:pt-24">
        <h1 className="max-w-[20ch] font-display text-3xl font-medium leading-tight text-ink text-balance sm:text-5xl">
          If you&rsquo;re asking the question, you already know something.
        </h1>
      </section>

      {/* Her Tuesday */}
      <section className="mx-auto max-w-xl space-y-5 px-5 pb-12">
        {WHEN_TUESDAY.map((p, i) => (
          <p key={i} className="text-xl leading-relaxed text-ink-soft text-pretty">
            {p}
          </p>
        ))}
      </section>

      <CtaBand headline="Nothing has to be decided today. You can just come look." />

      {/* The signs */}
      <section className="border-b border-line bg-surface py-16">
        <div className="mx-auto max-w-2xl px-5">
          <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            The things you&rsquo;ve been noticing
          </h2>
          <p className="mt-4 max-w-[32em] text-lg leading-relaxed text-ink-soft">
            {WHEN_SIGNS_LEDE}
          </p>
          <div className="mt-8">
            <EssayRows items={WHEN_SIGNS} />
          </div>
        </div>
      </section>

      {/* The turn */}
      <section className="mx-auto max-w-xl space-y-5 px-5 py-16">
        <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">
          {WHEN_TURN.heading}
        </h2>
        {WHEN_TURN.paras.map((p, i) => (
          <p key={i} className="text-lg leading-relaxed text-ink-soft text-pretty">
            {p}
          </p>
        ))}
        <p className="border-l-[3px] border-clay pl-4 font-display text-xl leading-snug text-ink text-pretty sm:text-2xl">
          {WHEN_TURN.pull}
        </p>
      </section>

      {/* Proof + quote */}
      <section className="mx-auto max-w-3xl px-5 pb-16">
        <div className="border-t border-line pt-10">
          <ProofPulse />
        </div>
        <div className="mt-10">
          <FamilyQuote quote={WHEN_QUOTE.quote} who={WHEN_QUOTE.who} />
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-5 pb-4">
        <Accordion
          heading="Questions families ask"
          items={WHEN_FAQ.map((f) => ({ title: f.title, body: f.body }))}
          idPrefix="when-faq"
          defaultOpen={null}
        />
      </section>

      <div className="mt-16">
        <CtaBand
          headline="You don't have to decide anything. Come see what it could look like."
          dark
        />
      </div>
    </>
  );
}
