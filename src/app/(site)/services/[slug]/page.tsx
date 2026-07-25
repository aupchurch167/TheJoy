import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BUSINESS,
  getServiceDetail,
  visibleServiceDetails,
} from "@/lib/site";
import { serviceJsonLd } from "@/lib/schema";
import { getSettings } from "@/lib/settings";
import TourButton from "@/components/TourButton";

// Detail pages are static content; prerender each visible service.
export function generateStaticParams() {
  return visibleServiceDetails().map((s) => ({ slug: s.slug }));
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
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceDetail(slug);
  if (!service) notFound();

  const settings = await getSettings();

  return (
    <div className="prose-joy mx-auto max-w-2xl px-5 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceJsonLd(service)),
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
          <TourButton variant="light" href={settings.talkfurther_url}>
            Book a tour
          </TourButton>
        </div>
      </div>
    </div>
  );
}
