import type { Metadata } from "next";
import { BUSINESS, OG_IMAGE } from "@/lib/site";
import {
  RATES,
  RATES_NOTE,
  COST_LEDGER,
  COST_FAQ,
  COST_VALUE_QUOTE,
} from "@/lib/landing";
import { getSitePhotos } from "@/lib/site-photos";
import Photo from "@/components/Photo";
import Accordion from "@/components/Accordion";
import CtaBand from "@/components/landing/CtaBand";
import ProofPulse from "@/components/landing/ProofPulse";
import FamilyQuote from "@/components/landing/FamilyQuote";
import CostCalculator from "@/components/landing/CostCalculator";

export const metadata: Metadata = {
  title: "What it costs",
  description:
    "Joy Senior Living's rates in Loganville, GA. Senior living from $5,500 a month, respite from $300 a day. The number, and what it replaces.",
  alternates: { canonical: "/cost" },
  openGraph: {
    title: `What it costs | ${BUSINESS.name}`,
    description: BUSINESS.descriptor,
    url: "/cost",
    type: "website",
    images: [OG_IMAGE],
  },
};

export default async function CostPage() {
  const { costHero } = await getSitePhotos();

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-2xl px-5 pt-14 pb-8 sm:pt-20">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-faint">
          What it costs
        </p>
        <h1 className="mt-4 max-w-[18ch] font-display text-4xl font-semibold text-ink text-balance sm:text-5xl">
          The number is real. So is what it replaces.
        </h1>
        <p className="mt-5 max-w-[34em] text-lg leading-relaxed text-ink-soft">
          Most places make you call to find out. Here&rsquo;s ours.
        </p>
      </section>

      {/* Hero image */}
      <section className="mx-auto max-w-5xl px-5 pb-10">
        <Photo
          src={costHero.src}
          alt={costHero.alt}
          priority
          rounded="rounded-3xl"
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="aspect-[16/9] w-full"
        />
      </section>

      <CtaBand headline="Come stand in it. Mellissa gives every tour herself." />

      {/* What the number replaces (ledger) */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="max-w-[20ch] font-display text-3xl font-semibold text-ink text-balance sm:text-4xl">
          What the number replaces
        </h2>
        <p className="mt-4 max-w-[34em] text-lg leading-relaxed text-ink-soft">
          {COST_LEDGER.intro}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Staying home */}
          <div className="flex flex-col rounded-2xl border border-line bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-gold">
              {COST_LEDGER.home.label}
            </p>
            <dl className="mt-4 divide-y divide-line">
              {COST_LEDGER.home.rows.map((row) => (
                <div
                  key={row.item}
                  className="flex items-baseline justify-between gap-4 py-3"
                >
                  <dt className="text-ink-soft">{row.item}</dt>
                  <dd className="whitespace-nowrap font-semibold text-ink">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 font-display text-lg italic leading-snug text-ink-soft">
              {COST_LEDGER.home.close}
            </p>
          </div>

          {/* One rate at Joy */}
          <div className="flex flex-col rounded-2xl border border-clay/25 bg-clay/[0.06] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-clay-dark">
              {COST_LEDGER.joy.label}
            </p>
            <dl className="mt-4 divide-y divide-clay/15">
              {COST_LEDGER.joy.rows.map((row) => (
                <div
                  key={row.item}
                  className="flex items-baseline justify-between gap-4 py-3"
                >
                  <dt className="text-ink-soft">{row.item}</dt>
                  <dd className="whitespace-nowrap font-semibold text-ink">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 font-display text-lg italic leading-snug text-ink-soft">
              {COST_LEDGER.joy.close}
            </p>
          </div>
        </div>
      </section>

      {/* At-home cost calculator (the bridge: our estimates, then hers). */}
      <CostCalculator />

      {/* Rates (below the calculator: her numbers first, then ours). */}
      <section className="border-y border-line bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            Our rates
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {RATES.map((r) => (
              <div
                key={r.key}
                className="rounded-2xl border border-line bg-paper p-6"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
                  {r.label}
                </p>
                <p className="mt-2 font-display text-4xl font-semibold leading-none text-ink">
                  {r.amount}
                </p>
                <p className="mt-1.5 text-ink-soft">{r.unit}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-[38em] text-lg leading-relaxed text-ink-soft">
            {RATES_NOTE}
          </p>
        </div>
      </section>

      <CtaBand headline="Bring your numbers. We'll go through them at the kitchen table." />

      {/* Proof pulse + value quote */}
      <section className="mx-auto max-w-3xl px-5 py-16">
        <ProofPulse />
        <div className="mt-10">
          <FamilyQuote quote={COST_VALUE_QUOTE.quote} who={COST_VALUE_QUOTE.who} />
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-5 pb-4">
        <Accordion
          heading="Questions families ask"
          items={COST_FAQ.map((f) => ({ title: f.title, body: f.body }))}
          idPrefix="cost-faq"
          defaultOpen={0}
        />
      </section>

      <div className="mt-16">
        <CtaBand headline="You can read a number. You can't read a house." dark />
      </div>
    </>
  );
}
