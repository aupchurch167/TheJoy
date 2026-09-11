import type { Metadata } from "next";
import { BUSINESS, OG_IMAGE } from "@/lib/site";
import { breadcrumbJsonLd } from "@/lib/schema";
import JsonLd from "@/components/JsonLd";
import { reviewQuotes, REVIEW_BADGES, REVIEW_LINKS } from "@/lib/landing";
import CtaBand from "@/components/landing/CtaBand";
import ProofPulse from "@/components/landing/ProofPulse";
import FamilyQuote from "@/components/landing/FamilyQuote";

export const metadata: Metadata = {
  title: {
    absolute: "Reviews: What Families Say About The Joy | Loganville, GA",
  },
  description:
    "Real reviews from families of The Joy Senior Living of Loganville, plus our A Place for Mom Best of Senior Living awards (2025, 2026) and links to every profile.",
  alternates: { canonical: "/reviews" },
  openGraph: {
    title: `Reviews from families | ${BUSINESS.name}`,
    description: BUSINESS.descriptor,
    url: "/reviews",
    type: "website",
    images: [OG_IMAGE],
  },
};

export default function ReviewsPage() {
  const quotes = reviewQuotes();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Reviews", path: "/reviews" },
        ])}
      />
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-5 pt-14 pb-10 sm:pt-20">
        <h1 className="max-w-[20ch] font-display text-4xl font-semibold text-ink text-balance sm:text-5xl">
          What families say when we&rsquo;re not in the room.
        </h1>
        <div className="mt-8 flex flex-wrap gap-2.5">
          {REVIEW_BADGES.map((b) => (
            <span
              key={b.label}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm"
            >
              <span className="font-semibold text-clay">{b.label}</span>
              <span className="text-ink-soft">{b.value}</span>
            </span>
          ))}
        </div>
      </section>

      <CtaBand headline="Read them all. Then come see whether it's true." />

      {/* Quote wall */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 px-5">
          {quotes.map((q, i) => (
            <FamilyQuote key={i} quote={q.quote} who={q.who} align={q.align} />
          ))}
        </div>
      </section>

      {/* Links out */}
      <section className="mx-auto max-w-2xl px-5 pb-14">
        <p className="max-w-[34em] text-lg leading-relaxed text-ink-soft">
          These are copied as families wrote them, nothing trimmed. You can read
          them where they were posted:
        </p>
        <div className="mt-5 divide-y divide-line border-y border-line">
          {REVIEW_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center text-ink hover:text-clay"
            >
              {l.label} <span aria-hidden className="ml-1">&rarr;</span>
            </a>
          ))}
        </div>
      </section>

      {/* Proof pulse */}
      <section className="mx-auto max-w-3xl px-5 pb-16">
        <div className="border-t border-line pt-10">
          <ProofPulse />
        </div>
      </section>

      <CtaBand
        headline="The reviews are other people's Tuesdays. Come have your own."
        dark
      />
    </>
  );
}
