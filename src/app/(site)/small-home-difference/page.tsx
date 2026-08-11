import type { Metadata } from "next";
import { BUSINESS, OG_IMAGE } from "@/lib/site";
import {
  SMALL_TUESDAY,
  SMALL_INTRO,
  SMALL_CONTRASTS,
  SMALL_PULL,
  SMALL_QUOTE,
  SMALL_FAQ,
} from "@/lib/landing";
import Accordion from "@/components/Accordion";
import CtaBand from "@/components/landing/CtaBand";
import ProofPulse from "@/components/landing/ProofPulse";
import FamilyQuote from "@/components/landing/FamilyQuote";

export const metadata: Metadata = {
  title: "The small-home difference",
  description:
    "Twenty-four residents, not a hundred and twenty. What a small personal care home in Loganville, GA does that a big building can't, told plainly.",
  alternates: { canonical: "/small-home-difference" },
  openGraph: {
    title: `The small-home difference | ${BUSINESS.name}`,
    description: BUSINESS.descriptor,
    url: "/small-home-difference",
    type: "website",
    images: [OG_IMAGE],
  },
};

export default function SmallHomeDifferencePage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-2xl px-5 pt-16 pb-8 sm:pt-20">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-faint">
          24 residents
        </p>
        <h1 className="mt-4 max-w-[20ch] font-display text-4xl font-semibold text-ink text-balance sm:text-5xl">
          The big place had a chandelier. Ask what else it had.
        </h1>
      </section>

      {/* Tuesday open */}
      <section className="mx-auto max-w-lg space-y-5 px-5 pb-12">
        {SMALL_TUESDAY.map((p, i) => (
          <p key={i} className="text-xl leading-relaxed text-ink-soft text-pretty">
            {p}
          </p>
        ))}
      </section>

      <CtaBand headline="See the other kind of place before you decide." />

      {/* The comparison (essay) */}
      <section className="border-b border-line bg-surface py-16">
        <div className="mx-auto max-w-2xl px-5">
          <h2 className="font-display text-3xl font-semibold text-ink text-balance sm:text-4xl">
            {SMALL_INTRO.heading}
          </h2>
          <p className="mt-4 max-w-[34em] text-lg leading-relaxed text-ink-soft">
            {SMALL_INTRO.body}
          </p>

          <div className="mt-10 space-y-10">
            {SMALL_CONTRASTS.map((c, i) => (
              <div
                key={c.heading}
                className={i > 0 ? "border-t border-line pt-10" : ""}
              >
                <p className="font-display text-xl leading-snug text-ink sm:text-2xl">
                  {c.heading}
                </p>
                <p className="mt-2 max-w-[34em] text-lg leading-relaxed text-ink-soft">
                  {c.body}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-12 border-l-[3px] border-clay pl-4 font-display text-2xl leading-snug text-ink text-pretty sm:text-3xl">
            {SMALL_PULL}
          </p>
        </div>
      </section>

      {/* Proof + quote */}
      <section className="mx-auto max-w-3xl px-5 py-16">
        <ProofPulse />
        <div className="mt-10">
          <FamilyQuote quote={SMALL_QUOTE.quote} who={SMALL_QUOTE.who} />
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-5 pb-4">
        <Accordion
          heading="Questions families ask"
          items={SMALL_FAQ.map((f) => ({ title: f.title, body: f.body }))}
          idPrefix="small-faq"
          defaultOpen={null}
        />
      </section>

      <div className="mt-16">
        <CtaBand headline="Stand in both. Then decide." dark />
      </div>
    </>
  );
}
