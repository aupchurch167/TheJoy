import type { Metadata } from "next";
import {
  BUSINESS,
  BUSINESS_ADDRESS_ONE_LINE,
  OG_IMAGE,
} from "@/lib/site";
import { contactPageJsonLd, breadcrumbJsonLd } from "@/lib/schema";
import { getSettings, toTelHref } from "@/lib/settings";
import JsonLd from "@/components/JsonLd";
import TourButton from "@/components/TourButton";
import LeadForm from "@/components/LeadForm";

// A real page (not a fragment) so the old tour/contact URLs 301 here cleanly.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // Brand is appended by the root layout title template; do not repeat it here.
  title: "Book a Tour",
  description:
    "Book a tour of Joy Senior Living, a small personal care home in Loganville, GA. See the home, meet Mellissa, and ask anything. No pressure.",
  alternates: { canonical: "/tour" },
  openGraph: {
    title: `Book a Tour | ${BUSINESS.name}`,
    description: BUSINESS.descriptor,
    url: "/tour",
    type: "website",
    images: [OG_IMAGE],
  },
};

export default async function TourPage() {
  const settings = await getSettings();
  const firstName = BUSINESS.director.name.split(" ")[0];

  return (
    <div className="prose-joy">
      <JsonLd data={contactPageJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Book a tour", path: "/tour" },
        ])}
      />
      {/* Intro + the one tour path */}
      <section className="mx-auto max-w-2xl px-5 pt-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-clay">
          Come see it
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-ink sm:text-5xl">
          Book a tour of Joy
        </h1>
        <p className="mt-6 text-xl leading-relaxed text-ink">
          The best way to understand a small home is to stand in it. Come by,
          meet {firstName}, and see the rooms, the kitchen, and the porch for
          yourself.
        </p>
        <div className="mt-6 space-y-5 text-lg text-ink-soft">
          <p>
            A visit takes about an hour. {BUSINESS.director.name},
            {" "}Joy&apos;s {BUSINESS.director.title}, walks you through the
            home, answers your questions, and tells you honestly whether Joy is
            the right fit for your parent. There is no pressure and nothing to
            sign.
          </p>
          <p>
            Prefer to talk first? Call and ask for {firstName}. If a tour is
            hard to arrange right now, send a note below and she will reach out
            to set up a time that works.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <TourButton href={settings.talkfurther_url}>Book a tour</TourButton>
          <a
            href={toTelHref(settings.phone)}
            className="text-lg font-semibold text-clay hover:text-clay-dark"
          >
            Or call {firstName}: {settings.phone}
          </a>
        </div>

        <p className="mt-6 text-base text-ink-soft">
          {BUSINESS.name} ({BUSINESS.legalDescriptor}) is at{" "}
          {BUSINESS_ADDRESS_ONE_LINE}.
        </p>
      </section>

      {/* Lead form */}
      <section className="mx-auto mt-12 max-w-2xl px-5 pb-20">
        <LeadForm
          source="tour"
          heading="Ask about a tour"
          blurb={`Tell us a little about your parent and what you are looking for. ${firstName} will get back to you.`}
        />
      </section>
    </div>
  );
}
