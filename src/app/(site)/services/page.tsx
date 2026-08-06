import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS, OG_IMAGE, SERVICES, visibleServiceDetails } from "@/lib/site";
import { getSettings } from "@/lib/settings";
import { getServicePhotos } from "@/lib/site-photos";
import Photo from "@/components/Photo";
import TourButton from "@/components/TourButton";
import LeadForm from "@/components/LeadForm";

export const metadata: Metadata = {
  title: "Memory Care & Personal Care Home in Loganville, GA",
  description:
    "Joy Senior Living is a small personal care home in Loganville, GA offering personal care, memory care, respite stays, daily activities, and home-cooked meals. Care at a scale small enough to know your parent by name.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: `Services | ${BUSINESS.name}`,
    description: BUSINESS.descriptor,
    url: "/services",
    type: "website",
    images: [OG_IMAGE],
  },
};

export default async function ServicesPage() {
  const [settings, servicePhotos] = await Promise.all([
    getSettings(),
    getServicePhotos(),
  ]);
  const services = visibleServiceDetails();

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
          {SERVICES.heading}
        </h1>
        <p className="mt-6 text-xl leading-relaxed text-ink">{SERVICES.lede}</p>
      </div>

      {/* Cards on the left, a sticky quick-contact form on the right. */}
      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-6 sm:grid-cols-2">
            {services.map((s) => {
              const photo = servicePhotos.get(s.slug);
              // Memory care has its own top-level page; everything else uses
              // the /services/[slug] detail page.
              const href =
                s.slug === "memory-care" ? "/memory-care" : `/services/${s.slug}`;
              return (
                <Link
                  key={s.slug}
                  href={href}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white no-underline shadow-sm transition hover:border-clay"
                >
                  <Photo
                    src={photo?.src || s.photo.src}
                    alt={photo?.alt || s.photo.alt}
                    rounded="rounded-none"
                    className="aspect-[4/3] w-full"
                  />
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-display text-xl font-semibold text-ink">
                      {s.name}
                    </h2>
                    <p className="mt-2 flex-1 text-base leading-relaxed text-ink-soft">
                      {s.tagline}
                    </p>
                    <span className="mt-4 inline-block text-sm font-semibold text-clay group-hover:text-clay-dark">
                      Learn more &rarr;
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Scale: the through-line for every service above. */}
          <h2 className="mt-14 font-display text-2xl font-semibold text-ink">
            {SERVICES.scaleHeading}
          </h2>
          <div className="mt-4 space-y-5 text-lg text-ink-soft">
            {SERVICES.scale.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {/* Search-context framing (§4) */}
          <p className="mt-10 border-l-2 border-line pl-5 text-base leading-relaxed text-ink-faint">
            {SERVICES.assistedLivingContext}
          </p>
        </div>

        {/* Quick-action CTA. Sticky on desktop, stacks under the cards on
            mobile. Posts to the same lead pipeline, tagged as the services form. */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <LeadForm
              compact
              source="services_form"
              heading="Get in touch with us"
              blurb={`Tell us a little about your parent and we will call you back. Or call ${BUSINESS.director.name} at ${settings.phone}.`}
            />
          </div>
        </aside>
      </div>

      {/* Single tour CTA */}
      <div className="mt-14 rounded-2xl bg-ink px-6 py-8 text-center text-white">
        <p className="font-display text-2xl font-semibold">
          See it for your parent
        </p>
        <p className="mx-auto mt-2 max-w-md text-white/80">
          The best way to understand what Joy offers is to walk through it. Book
          a tour, or call {BUSINESS.director.name} at {settings.phone}.
        </p>
        <div className="mt-5">
          <TourButton variant="light" href={settings.talkfurther_url}>
            Book a tour
          </TourButton>
        </div>
      </div>
    </div>
  );
}
