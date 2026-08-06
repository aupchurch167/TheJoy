import type { Metadata } from "next";
import { ABOUT, BUSINESS, MELLISSA, OG_IMAGE } from "@/lib/site";
import { aboutPageJsonLd } from "@/lib/schema";
import { getSettings, tourHref } from "@/lib/settings";
import { getSitePhotos } from "@/lib/site-photos";
import JsonLd from "@/components/JsonLd";
import Photo from "@/components/Photo";
import TourButton from "@/components/TourButton";

export const metadata: Metadata = {
  title: "About The Joy Senior Living of Loganville",
  description:
    "The story of Joy Senior Living, a small personal care home in Loganville, GA led by Mellissa Daniel, and why small scale changes everything.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About ${BUSINESS.name}`,
    description: BUSINESS.descriptor,
    url: "/about",
    type: "website",
    images: [OG_IMAGE],
  },
};

export default async function AboutPage() {
  const settings = await getSettings();
  const { aboutMellissa, about } = await getSitePhotos();
  // The About page's own two photos (editable in admin > Site Photos > About).
  const aboutPhotos = about.filter(Boolean);

  return (
    <div className="prose-joy">
      <JsonLd data={aboutPageJsonLd()} />
      {/* Intro */}
      <section className="mx-auto max-w-2xl px-5 pt-16">
        <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
          {ABOUT.heading}
        </h1>
        <p className="mt-6 text-xl leading-relaxed text-ink">{ABOUT.lede}</p>
        <div className="mt-6 space-y-5 text-lg text-ink-soft">
          {ABOUT.story.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      {/* Photos */}
      <section className="mx-auto mt-12 max-w-5xl px-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {aboutPhotos.map((p, i) => (
            <Photo
              key={i}
              src={p.src}
              alt={p.alt}
              className="aspect-[4/3] w-full ring-1 ring-line"
            />
          ))}
        </div>
      </section>

      {/* A day here */}
      <section className="mx-auto mt-14 max-w-2xl px-5">
        <h2 className="font-display text-3xl font-semibold text-ink">
          {ABOUT.dayHeading}
        </h2>
        <div className="mt-5 space-y-5 text-lg text-ink-soft">
          {ABOUT.day.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      {/* Mellissa */}
      <section className="mx-auto mt-14 max-w-5xl px-5">
        <div className="grid items-center gap-10 sm:grid-cols-[minmax(0,320px)_1fr]">
          <Photo
            src={aboutMellissa.src}
            alt={aboutMellissa.alt}
            className="aspect-[4/5] w-full ring-1 ring-line"
          />
          <div>
            <h2 className="font-display text-3xl font-semibold text-ink">
              {ABOUT.mellissaHeading}
            </h2>
            <div className="mt-5 space-y-5 text-lg text-ink-soft">
              {ABOUT.mellissa.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {MELLISSA.quote.trim() !== "" && (
              <blockquote className="mt-6 border-l-2 border-clay pl-5">
                <p className="font-display text-xl italic leading-relaxed text-ink">
                  {MELLISSA.quote}
                </p>
                <footer className="mt-3 text-sm font-medium text-ink-faint">
                  {BUSINESS.director.name}, {BUSINESS.director.title}
                </footer>
              </blockquote>
            )}
          </div>
        </div>
      </section>

      {/* License + CTA */}
      <section className="mx-auto mt-14 max-w-2xl px-5 pb-20">
        <p className="border-l-2 border-line pl-5 text-lg leading-relaxed text-ink-soft">
          {ABOUT.licenseNote}
        </p>
        <div className="mt-8">
          <TourButton href={tourHref(settings)}>Book a tour</TourButton>
        </div>
      </section>
    </div>
  );
}
