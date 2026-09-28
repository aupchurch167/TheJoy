import type { Metadata } from "next";
import { pageTwitter } from "@/lib/metadata";
import { notFound } from "next/navigation";
import { OG_IMAGE, SITE_URL } from "@/lib/site";
import {
  breadcrumbJsonLd,
  faqPageJsonLdFrom,
  servingServiceJsonLd,
} from "@/lib/schema";
import JsonLd from "@/components/JsonLd";
import { TOWNS, TOWN_MELLISSA } from "@/lib/landing";
import Accordion from "@/components/Accordion";
import CtaBand from "@/components/landing/CtaBand";
import ProofPulse from "@/components/landing/ProofPulse";
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
  return pageTwitter({
    title: { absolute: t.title },
    description: t.description,
    alternates: { canonical: `/serving/${t.slug}` },
    openGraph: {
      title: t.title,
      description: t.description,
      url: `/serving/${t.slug}`,
      type: "website",
      images: [OG_IMAGE],
    },
  });
}

function SectionCopy({
  heading,
  paragraphs,
  pull,
}: {
  heading: string;
  paragraphs: string[];
  pull?: string;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        {heading}
      </h2>
      {paragraphs.map((p) => (
        <p key={p} className="max-w-[34em] text-lg leading-relaxed text-ink-soft">
          {p}
        </p>
      ))}
      {pull ? (
        <p className="border-l-[3px] border-clay pl-4 font-display text-xl leading-snug text-ink text-pretty">
          {pull}
        </p>
      ) : null}
    </div>
  );
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
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: `Serving ${t.name}`, path: `/serving/${t.slug}` },
        ])}
      />
      <JsonLd data={servingServiceJsonLd(t)} />
      <JsonLd
        data={faqPageJsonLdFrom(t.faqs, `${SITE_URL}/serving/${t.slug}#faq`)}
      />
      <section className="mx-auto max-w-2xl px-5 pt-14 pb-8 sm:pt-20">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-faint">
          {t.eyebrow}
        </p>
        <h1 className="mt-4 max-w-[22ch] font-display text-4xl font-semibold text-ink text-balance sm:text-5xl">
          {t.h1}
        </h1>
        <p className="mt-5 max-w-[33em] text-lg leading-relaxed text-ink-soft">
          {t.lede}
        </p>
      </section>

      <CtaBand
        headline={t.openingCta.headline}
        note={t.openingCta.note}
        phoneLead={t.openingCta.phoneLead}
      />

      <section className="border-y border-line bg-surface py-14 sm:py-16">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-12 gap-y-8 px-5">
          <div className="min-w-[13rem] flex-1">
            <div className="rounded-2xl border border-line bg-paper p-5">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 flex-none rounded-full bg-ink-faint" />
                <span className="text-sm font-medium text-ink-soft">{t.name}</span>
              </div>
              <div className="flex items-center gap-3 pl-[3px]">
                <span className="ml-px h-10 w-0 border-l-2 border-dashed border-clay" />
                <span className="text-sm text-ink-soft">
                  &asymp; {t.driveMinutes} min
                  {t.highway ? <> &middot; {t.highway}</> : null}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 flex-none rounded-full bg-clay" />
                <span className="text-sm font-medium text-clay-dark">
                  The Joy &middot; Loganville
                </span>
              </div>
            </div>
          </div>
          <div className="min-w-[16rem] flex-[1.4]">
            <SectionCopy {...t.lead} />
          </div>
        </div>
      </section>

      {t.sections.map((section) => (
        <section key={section.heading} className="mx-auto max-w-2xl px-5 py-16">
          <SectionCopy {...section} />
        </section>
      ))}

      <section className="mx-auto max-w-3xl px-5 pb-16">
        <div className="border-t border-line pt-10">
          <ProofPulse
            caption={t.mellissaCaption}
            alt={TOWN_MELLISSA.alt}
            src={TOWN_MELLISSA.src}
          />
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-5 pb-4">
        <Accordion
          heading={t.faqsHeading}
          items={t.faqs.map((f) => ({ title: f.title, body: f.body }))}
          idPrefix="serving-faq"
          defaultOpen={null}
        />
      </section>

      <div className="mt-16">
        <CtaBand
          headline={t.closingCta.headline}
          note={t.closingCta.note}
          phoneLead={t.closingCta.phoneLead}
          dark
        />
      </div>
    </>
  );
}
