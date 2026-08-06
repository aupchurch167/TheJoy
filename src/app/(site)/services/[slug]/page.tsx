import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  BUSINESS,
  getServiceDetail,
  OG_IMAGE,
  visibleServiceDetails,
} from "@/lib/site";
import { serviceJsonLd, breadcrumbJsonLd } from "@/lib/schema";
import { getSettings, tourHref } from "@/lib/settings";
import { getServicePhotos } from "@/lib/site-photos";
import Photo from "@/components/Photo";
import StepTimeline from "@/components/StepTimeline";
import Accordion from "@/components/Accordion";
import TourButton from "@/components/TourButton";

// Memory care has its own richer top-level page (/memory-care). This detail
// slug redirects there so the two are always the same, single, canonical page.
const REDIRECT_TO_MEMORY_CARE = "/memory-care";

// Detail pages are static content; prerender each visible service except
// memory care, which redirects to /memory-care.
export function generateStaticParams() {
  return visibleServiceDetails()
    .filter((s) => s.slug !== "memory-care")
    .map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceDetail(slug);
  if (!service) return { title: "Not found", robots: { index: false } };

  return {
    title: service.metaTitle,
    description: service.metaDescription,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: `${service.name} | ${BUSINESS.name}`,
      description: service.metaDescription,
      url: `/services/${service.slug}`,
      type: "website",
      images: [OG_IMAGE],
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "memory-care") redirect(REDIRECT_TO_MEMORY_CARE);

  const service = getServiceDetail(slug);
  if (!service) notFound();

  const [settings, servicePhotos] = await Promise.all([
    getSettings(),
    getServicePhotos(),
  ]);
  const photo = servicePhotos.get(service.slug) || service.photo;

  return (
    <div className="prose-joy mx-auto max-w-2xl px-5 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceJsonLd(service)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Services", path: "/services" },
              { name: service.name, path: `/services/${service.slug}` },
            ])
          ),
        }}
      />

      <Link
        href="/services"
        className="text-sm font-semibold text-clay hover:text-clay-dark"
      >
        &larr; All services
      </Link>

      <h1 className="mt-6 font-display text-4xl font-semibold text-ink sm:text-5xl">
        {service.name}
      </h1>
      <p className="mt-4 text-xl leading-relaxed text-ink">{service.tagline}</p>

      <Photo
        src={photo.src}
        alt={photo.alt}
        priority
        className="mt-8 aspect-[16/9] w-full ring-1 ring-line"
      />

      <p className="mt-8 text-lg text-ink-soft">{service.intro}</p>

      {service.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="mt-12 font-display text-2xl font-semibold text-ink">
            {section.heading}
          </h2>
          <div className="mt-4 space-y-5 text-lg text-ink-soft">
            {section.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      ))}

      {/* Visual + interactive education (same treatment as the memory-care
          page): a "what to expect" timeline and a Q&A accordion. */}
      {service.education && (
        <>
          <StepTimeline
            heading={service.education.stepsHeading}
            lede={service.education.stepsLede}
            steps={service.education.steps}
          />
          <Accordion
            idPrefix={`faq-${service.slug}`}
            heading={service.education.faqsHeading}
            lede={service.education.faqsLede}
            items={service.education.faqs.map((f) => ({
              title: f.q,
              body: f.a,
            }))}
          />
        </>
      )}

      {/* Internal mesh: the rest of Joy's care (memory care lives at its own
          top-level page). All targets exist, so no dead links. */}
      {(() => {
        const siblings = visibleServiceDetails().filter(
          (s) => s.slug !== service.slug
        );
        if (siblings.length === 0) return null;
        return (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Explore more of Joy&rsquo;s care
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {siblings.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={
                      s.slug === "memory-care"
                        ? "/memory-care"
                        : `/services/${s.slug}`
                    }
                    className="font-semibold text-clay hover:text-clay-dark"
                  >
                    {s.name}
                  </Link>
                  <span className="block text-sm text-ink-soft">
                    {s.tagline}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })()}

      {/* Single tour CTA (§: one tour path only). */}
      <div className="mt-14 rounded-2xl bg-ink px-6 py-8 text-center text-white">
        <p className="font-display text-2xl font-semibold">
          See it for your parent
        </p>
        <p className="mx-auto mt-2 max-w-md text-white/80">
          The best way to understand {service.name.toLowerCase()} at Joy is to
          walk through it. Book a tour, or call {BUSINESS.director.name} at{" "}
          {settings.phone}.
        </p>
        <div className="mt-5">
          <TourButton variant="light" href={tourHref(settings)}>
            Book a tour
          </TourButton>
        </div>
      </div>
    </div>
  );
}
