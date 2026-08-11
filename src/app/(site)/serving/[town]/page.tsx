import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BUSINESS, OG_IMAGE } from "@/lib/site";
import { TOWNS } from "@/lib/landing";
import Accordion from "@/components/Accordion";
import CtaBand from "@/components/landing/CtaBand";
import ProofPulse from "@/components/landing/ProofPulse";
import FamilyQuote from "@/components/landing/FamilyQuote";

export function generateStaticParams() {
  return Object.keys(TOWNS).map((town) => ({ town }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ town: string }>;
}): Promise<Metadata> {
  const { town } = await params;
  const t = TOWNS[town];
  if (!t) return {};
  return {
    title: `Senior living near ${t.name}, GA`,
    description: `Joy is a small personal care home about ${t.driveMinutes} minutes from ${t.name}, GA. Close enough to visit after work. Book a tour.`,
    alternates: { canonical: `/serving/${t.slug}` },
    openGraph: {
      title: `Senior living near ${t.name} | ${BUSINESS.name}`,
      description: BUSINESS.descriptor,
      url: `/serving/${t.slug}`,
      type: "website",
      images: [OG_IMAGE],
    },
  };
}

export default async function ServingTownPage({
  params,
}: {
  params: Promise<{ town: string }>;
}) {
  const { town } = await params;
  const t = TOWNS[town];
  if (!t) notFound();

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-2xl px-5 pt-14 pb-8 sm:pt-20">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Serving {t.name}
        </p>
        <h1 className="mt-4 max-w-[18ch] font-display text-4xl font-semibold text-ink text-balance sm:text-5xl">
          Close enough to stay her daughter.
        </h1>
        <p className="mt-5 max-w-[33em] text-lg leading-relaxed text-ink-soft">
          {t.heroLede}
        </p>
      </section>

      <CtaBand headline="Drive it once and you'll stop wondering." />

      {/* Distance */}
      <section className="border-y border-line bg-surface py-14 sm:py-16">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-12 gap-y-8 px-5">
          {/* Minimal route graphic */}
          <div className="min-w-[13rem] flex-1">
            <div className="rounded-2xl border border-line bg-paper p-5">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 flex-none rounded-full bg-ink-faint" />
                <span className="text-sm font-medium text-ink-soft">{t.name}</span>
              </div>
              <div className="flex items-center gap-3 pl-[3px]">
                <span className="ml-px h-10 w-0 border-l-2 border-dashed border-clay" />
                <span className="text-sm text-ink-soft">
                  &asymp; {t.driveMinutes} min &middot; {t.highway}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 flex-none rounded-full bg-clay" />
                <span className="text-sm font-medium text-clay-dark">
                  Joy &middot; Loganville
                </span>
              </div>
            </div>
          </div>

          {/* Prose (the persuasion) */}
          <div className="min-w-[16rem] flex-[1.4] space-y-4">
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              {t.distanceHeading}
            </h2>
            {t.distanceProse.map((p, i) => (
              <p key={i} className="max-w-[34em] text-lg leading-relaxed text-ink-soft">
                {p}
              </p>
            ))}
            <p className="border-l-[3px] border-clay pl-4 font-display text-xl leading-snug text-ink text-pretty">
              {t.distancePull}
            </p>
          </div>
        </div>
      </section>

      {/* Local anchor (rewritten per town) */}
      <section className="mx-auto max-w-2xl px-5 py-16">
        <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <h2 className="max-w-[24ch] font-display text-2xl font-semibold text-ink text-balance sm:text-3xl">
            {t.anchorHeading}
          </h2>
          <div className="mt-4 space-y-4">
            {t.anchorParas.map((p, i) => (
              <p key={i} className="text-lg leading-relaxed text-ink-soft text-pretty">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Proof (+ optional local quote) */}
      <section className="mx-auto max-w-3xl px-5 pb-16">
        <div className="border-t border-line pt-10">
          <ProofPulse />
        </div>
        {t.quote && (
          <div className="mt-10">
            <FamilyQuote quote={t.quote.quote} who={t.quote.who} />
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-5 pb-4">
        <Accordion
          heading="Questions families ask"
          items={t.faqs.map((f) => ({ title: f.title, body: f.body }))}
          idPrefix="serving-faq"
          defaultOpen={null}
        />
      </section>

      <div className="mt-16">
        <CtaBand
          headline={`${t.driveMinutes} minutes from home. Come see it on a Tuesday.`}
          dark
        />
      </div>
    </>
  );
}
