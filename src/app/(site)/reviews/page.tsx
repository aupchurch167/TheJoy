import type { Metadata } from "next";
import { pageTwitter } from "@/lib/metadata";
import { BUSINESS, OG_IMAGE } from "@/lib/site";
import { breadcrumbJsonLd } from "@/lib/schema";
import JsonLd from "@/components/JsonLd";
import {
  REVIEW_BADGES,
  REVIEW_INTRO,
  REVIEW_LINKS,
  REVIEW_MELLISSA_ALT,
  REVIEW_MELLISSA_CAPTION,
  REVIEW_RATINGS_AS_OF,
  REVIEW_SURVEY,
  REVIEW_SURVEY_HEADING,
  REVIEW_WALL,
} from "@/lib/landing";
import { hasDatabase } from "@/lib/db";
import { listReviewSources } from "@/lib/reviews";
import CtaBand from "@/components/landing/CtaBand";
import ProofPulse from "@/components/landing/ProofPulse";
import FamilyQuote from "@/components/landing/FamilyQuote";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageTwitter({
  title: {
    absolute: "Reviews: What Families Say About The Joy | Loganville, GA",
  },
  description:
    "Families of residents at The Joy in Loganville, GA, in their own words. Plus our A Place for Mom Best of Senior Living awards for 2025 and 2026.",
  alternates: { canonical: "/reviews" },
  openGraph: {
    title: `Reviews from families | ${BUSINESS.name}`,
    description:
      "Families of residents at The Joy in Loganville, GA, in their own words. Plus our A Place for Mom Best of Senior Living awards for 2025 and 2026.",
    url: "/reviews",
    type: "website",
    images: [OG_IMAGE],
  },
});

export default async function ReviewsPage() {
  // Start from the curated code content, then prefer live DB data where present.
  let badges: { label: string; value: string }[] = REVIEW_BADGES;
  let links: { label: string; href: string }[] = REVIEW_LINKS;
  const wall = REVIEW_WALL.map((q, i) => ({
    ...q,
    align: (i % 2 ? "end" : "start") as "start" | "end",
  }));
  const survey = REVIEW_SURVEY.map((q, i) => ({
    ...q,
    align: ((REVIEW_WALL.length + i) % 2 ? "end" : "start") as "start" | "end",
  }));

  if (hasDatabase()) {
    try {
      const sources = await listReviewSources(true);

      const dbBadges = sources
        .filter((s) => s.rating_value || s.badge_label)
        .map((s) => ({ label: s.label, value: (s.rating_value || s.badge_label)! }));
      if (dbBadges.length) badges = dbBadges;

      const dbLinks = sources
        .filter((s) => s.profile_url)
        .map((s) => ({ label: `${s.label} profile`, href: s.profile_url! }));
      if (dbLinks.length) links = dbLinks;
    } catch {
      // Fall back to the curated code content if the DB is briefly unavailable.
    }
  }

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
          {badges.map((b) => (
            <span
              key={b.label}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm"
            >
              <span className="font-semibold text-clay">{b.label}</span>
              <span className="text-ink-soft">{b.value}</span>
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-faint">{REVIEW_RATINGS_AS_OF}</p>
      </section>

      <CtaBand headline="Read them all. Then come see whether it's true." />

      {/* Quote wall */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 px-5">
          {wall.map((q, i) => (
            <FamilyQuote key={i} quote={q.quote} who={q.who} align={q.align} />
          ))}
        </div>
        <div className="mx-auto mt-16 max-w-3xl px-5">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            {REVIEW_SURVEY_HEADING}
          </h2>
          <p className="mt-4 max-w-[34em] text-lg leading-relaxed text-ink-soft">
            We asked families how things were going. These answers are shown without names.
          </p>
          <div className="mt-8 flex flex-col gap-5">
            {survey.map((q, i) => (
              <FamilyQuote key={i} quote={q.quote} who={q.who} align={q.align} />
            ))}
          </div>
        </div>
      </section>

      {/* Links out */}
      <section className="mx-auto max-w-2xl px-5 pb-14">
        <p className="max-w-[34em] text-lg leading-relaxed text-ink-soft">
          {REVIEW_INTRO}
        </p>
        <div className="mt-5 divide-y divide-line border-y border-line">
          {links.map((l) => (
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
          <ProofPulse caption={REVIEW_MELLISSA_CAPTION} alt={REVIEW_MELLISSA_ALT} />
        </div>
      </section>

      <CtaBand
        headline="The reviews are other people's Tuesdays. Come have your own."
        dark
      />
    </>
  );
}
