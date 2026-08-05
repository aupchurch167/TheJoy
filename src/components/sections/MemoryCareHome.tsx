import Link from "next/link";
import { MEMORY_CARE } from "@/lib/site";
import { getSettings } from "@/lib/settings";
import TourButton from "@/components/TourButton";

/**
 * Homepage memory-care section ("When it's dementia"). Renders only while
 * memory care is confirmed within Joy's license (§4, MEMORY_CARE.enabled).
 * The CTA is the single tour path, and the text link points at the fuller page.
 */
export default async function MemoryCareHome() {
  if (!MEMORY_CARE.enabled) return null;
  const settings = await getSettings();

  return (
    <section id="memory-care" className="bg-white/60 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl px-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-clay">
          Memory care, within our personal care home
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
          {MEMORY_CARE.heading}
        </h2>

        <div className="mt-6 space-y-5 text-lg leading-relaxed text-ink-soft">
          {MEMORY_CARE.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-5">
          <TourButton href={settings.talkfurther_url}>
            {MEMORY_CARE.ctaLabel}
          </TourButton>
          <Link
            href="/memory-care"
            className="text-base font-semibold text-clay hover:text-clay-dark"
          >
            More on memory care at Joy &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
