import type { Metadata } from "next";
import { BUSINESS, OG_IMAGE } from "@/lib/site";
import { breadcrumbJsonLd } from "@/lib/schema";
import JsonLd from "@/components/JsonLd";
import { CHECKLIST_STATEMENT, CHECKLIST_QUOTE } from "@/lib/landing";
import CtaBand from "@/components/landing/CtaBand";
import ProofPulse from "@/components/landing/ProofPulse";
import FamilyQuote from "@/components/landing/FamilyQuote";
import TourChecklist from "@/components/landing/TourChecklist";

export const metadata: Metadata = {
  title: {
    absolute: "Assisted Living Tour Checklist: 25 Questions to Ask | Joy",
  },
  description:
    "25 questions to bring to any senior living tour: care, staffing, safety, money, gut checks. Free to read and print. Bring all 25 to Joy; we like the hard ones.",
  alternates: { canonical: "/tour-checklist" },
  openGraph: {
    title: `The tour checklist | ${BUSINESS.name}`,
    description: BUSINESS.descriptor,
    url: "/tour-checklist",
    type: "website",
    images: [OG_IMAGE],
  },
};

export default function TourChecklistPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Tour checklist", path: "/tour-checklist" },
        ])}
      />
      {/* Print: show only the checklist block. */}
      <style>{`@media print{body *{visibility:hidden!important}#tour-checklist,#tour-checklist *{visibility:visible!important}#tour-checklist{position:absolute;left:0;top:0;width:100%;padding:0}}`}</style>

      {/* Hero */}
      <section className="mx-auto max-w-2xl px-5 pt-14 pb-8 sm:pt-20">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-faint">
          The tour checklist
        </p>
        <h1 className="mt-4 max-w-[20ch] font-display text-4xl font-semibold text-ink text-balance sm:text-5xl">
          Walk into any tour knowing exactly what to ask.
        </h1>
        <p className="mt-5 max-w-[32em] text-lg leading-relaxed text-ink-soft">
          25 questions, free to read below, free to print. Use them everywhere
          you tour (including here).
        </p>
      </section>

      <CtaBand headline="Start with the easiest tour on your list." />

      {/* The 25 questions */}
      <section className="border-y border-line bg-surface py-14 sm:py-16">
        <div className="mx-auto max-w-3xl px-5">
          <TourChecklist />
        </div>
      </section>

      {/* Statement band */}
      <section className="bg-ink py-16 text-white print:hidden">
        <div className="mx-auto max-w-2xl px-5">
          <h2 className="font-display text-3xl font-semibold text-balance sm:text-4xl">
            {CHECKLIST_STATEMENT.heading}
          </h2>
          <p className="mt-4 max-w-[32em] text-lg leading-relaxed text-white/80">
            {CHECKLIST_STATEMENT.body}
          </p>
        </div>
      </section>

      {/* Proof + quote */}
      <section className="mx-auto max-w-3xl px-5 py-16 print:hidden">
        <ProofPulse />
        <div className="mt-10">
          <FamilyQuote quote={CHECKLIST_QUOTE.quote} who={CHECKLIST_QUOTE.who} />
        </div>
      </section>

      <div className="print:hidden">
        <CtaBand headline="Come use the list on us." dark />
      </div>
    </>
  );
}
