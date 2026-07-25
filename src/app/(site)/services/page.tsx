import type { Metadata } from "next";
import { BUSINESS, MEMORY_CARE, SERVICES } from "@/lib/site";
import { getSettings } from "@/lib/settings";
import TourButton from "@/components/TourButton";

export const metadata: Metadata = {
  title: "Memory Care & Personal Care Home in Loganville, GA",
  description:
    "Joy Senior Living is a small personal care home in Loganville, GA offering senior living and memory care. Personal care done at a scale small enough to know your parent by name.",
  keywords: [
    "memory care loganville ga",
    "personal care home loganville",
    "small assisted living georgia",
  ],
  alternates: { canonical: "/services" },
  openGraph: {
    title: `Services | ${BUSINESS.name}`,
    description: BUSINESS.descriptor,
    url: "/services",
    type: "website",
  },
};

export default async function ServicesPage() {
  const settings = await getSettings();

  return (
    <div className="prose-joy mx-auto max-w-2xl px-5 py-16">
      <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
        {SERVICES.heading}
      </h1>
      <p className="mt-6 text-xl leading-relaxed text-ink">{SERVICES.lede}</p>

      {/* Personal care */}
      <h2 className="mt-12 font-display text-2xl font-semibold text-ink">
        {SERVICES.careHeading}
      </h2>
      <div className="mt-4 space-y-5 text-lg text-ink-soft">
        {SERVICES.care.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {/* Memory care (gated on license confirmation) */}
      {MEMORY_CARE.enabled && (
        <>
          <h2 className="mt-12 font-display text-2xl font-semibold text-ink">
            {SERVICES.memoryHeading}
          </h2>
          <div className="mt-4 space-y-5 text-lg text-ink-soft">
            {SERVICES.memory.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </>
      )}

      {/* Respite / short stays */}
      <h2 className="mt-12 font-display text-2xl font-semibold text-ink">
        {SERVICES.respiteHeading}
      </h2>
      <div className="mt-4 space-y-5 text-lg text-ink-soft">
        {SERVICES.respite.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {/* Scale */}
      <h2 className="mt-12 font-display text-2xl font-semibold text-ink">
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

      {/* Single tour CTA */}
      <div className="mt-12 rounded-2xl bg-ink px-6 py-8 text-center text-white">
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
