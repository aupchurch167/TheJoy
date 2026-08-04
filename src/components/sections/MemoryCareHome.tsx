import Link from "next/link";
import { MEMORY_CARE, MEMORY_CARE_EDUCATION } from "@/lib/site";
import { getSettings } from "@/lib/settings";
import TourButton from "@/components/TourButton";

/**
 * Homepage memory-care section ("When it's dementia"). Renders only while
 * memory care is confirmed within Joy's license (§4, MEMORY_CARE.enabled).
 * A slim "steady day" strip previews the interactive memory-care page; the CTA
 * is the single tour path, and the text link points at the fuller page.
 */
export default async function MemoryCareHome() {
  if (!MEMORY_CARE.enabled) return null;
  const settings = await getSettings();

  return (
    <section id="memory-care" className="py-16 sm:py-20">
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

        {/* Preview of the "steady day" rhythm that anchors the memory-care
            page. Visual, and a nudge toward the deeper, interactive content. */}
        <div className="mt-8 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <p className="text-sm font-medium text-ink">
            The same day, on purpose:
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-ink-soft">
            {MEMORY_CARE_EDUCATION.rhythm.map((step, i) => (
              <span key={step.label} className="flex items-center gap-2">
                {i > 0 && (
                  <span aria-hidden className="text-clay">
                    &rarr;
                  </span>
                )}
                <span className="rounded-full bg-paper px-3 py-1 font-medium text-ink">
                  {step.label}
                </span>
              </span>
            ))}
          </div>
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
