import type { Metadata } from "next";
import Link from "next/link";
import { pageTwitter } from "@/lib/metadata";
import { OG_IMAGE, SITE_URL } from "@/lib/site";
import {
  breadcrumbJsonLd,
  countyServiceJsonLd,
  faqPageJsonLdFrom,
} from "@/lib/schema";
import { COUNTIES, TOWN_MELLISSA, type CountySlug } from "@/lib/landing";
import JsonLd from "@/components/JsonLd";
import Accordion from "@/components/Accordion";
import CtaBand from "@/components/landing/CtaBand";
import ProofPulse from "@/components/landing/ProofPulse";
import SectionCopy from "@/components/landing/SectionCopy";

/** Metadata for a /serving/<county> hub. */
export function countyMetadata(slug: CountySlug): Metadata {
  const c = COUNTIES[slug];
  return pageTwitter({
    title: { absolute: c.title },
    description: c.description,
    alternates: { canonical: `/serving/${c.slug}` },
    openGraph: {
      title: c.title,
      description: c.description,
      url: `/serving/${c.slug}`,
      type: "website",
      images: [OG_IMAGE],
    },
  });
}

/**
 * County hub page. Same building blocks as the town pages (CtaBand,
 * SectionCopy, ProofPulse, Accordion), plus a block of links down to the
 * town pages in that county.
 */
export default function CountyLanding({ slug }: { slug: CountySlug }) {
  const c = COUNTIES[slug];
  const url = `${SITE_URL}/serving/${c.slug}`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: `Serving ${c.name}`, path: `/serving/${c.slug}` },
        ])}
      />
      <JsonLd data={countyServiceJsonLd(c)} />
      <JsonLd data={faqPageJsonLdFrom(c.faqs, `${url}#faq`)} />

      <section className="mx-auto max-w-2xl px-5 pt-14 pb-8 sm:pt-20">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-faint">
          {c.eyebrow}
        </p>
        <h1 className="mt-4 max-w-[22ch] font-display text-4xl font-semibold text-ink text-balance sm:text-5xl">
          {c.h1}
        </h1>
        <p className="mt-5 max-w-[33em] text-lg leading-relaxed text-ink-soft">
          {c.lede}
        </p>
      </section>

      <CtaBand
        headline={c.openingCta.headline}
        note={c.openingCta.note}
        phoneLead={c.openingCta.phoneLead}
      />

      {c.sections.map((section) => (
        <section key={section.heading} className="mx-auto max-w-2xl px-5 py-16">
          <SectionCopy {...section} />
        </section>
      ))}

      <section className="border-y border-line bg-surface py-14 sm:py-16">
        <div className="mx-auto max-w-2xl px-5">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            {c.townsHeading}
          </h2>
          <ul className="mt-6 space-y-4">
            {c.towns.map((t) => (
              <li key={t.href} className="text-lg leading-relaxed text-ink-soft">
                <Link
                  href={t.href}
                  className="font-semibold text-clay underline underline-offset-2 hover:text-clay-dark"
                >
                  {t.name}
                </Link>
                . {t.line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <ProofPulse
          caption={c.mellissaCaption}
          alt={TOWN_MELLISSA.alt}
          src={TOWN_MELLISSA.src}
        />
      </section>

      <section id="faq" className="mx-auto max-w-2xl px-5 pb-4">
        <Accordion
          heading={c.faqsHeading}
          items={c.faqs.map((f) => ({ title: f.title, body: f.body }))}
          idPrefix="county-faq"
          defaultOpen={null}
        />
      </section>

      <div className="mt-16">
        <CtaBand
          headline={c.closingCta.headline}
          note={c.closingCta.note}
          phoneLead={c.closingCta.phoneLead}
          dark
        />
      </div>
    </>
  );
}
