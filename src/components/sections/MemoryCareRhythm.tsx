import { MEMORY_CARE_EDUCATION } from "@/lib/site";

/**
 * Visual "steady day" rhythm for the memory-care page. Routine is the therapy,
 * so we show it as a timeline: a horizontal track on wide screens, a vertical
 * one on mobile. Static (no interactivity needed), real content only.
 */
export default function MemoryCareRhythm() {
  const { rhythmHeading, rhythmLede, rhythm } = MEMORY_CARE_EDUCATION;

  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        {rhythmHeading}
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-ink-soft">{rhythmLede}</p>

      <ol className="mt-8 grid gap-6 sm:grid-cols-4 sm:gap-4">
        {rhythm.map((step, i) => (
          <li key={step.label} className="relative">
            {/* Connector line between nodes (horizontal on desktop). */}
            {i < rhythm.length - 1 && (
              <span
                aria-hidden
                className="absolute left-3 top-8 hidden h-px w-full bg-line sm:block"
              />
            )}
            <div className="flex items-center gap-3 sm:block">
              <span
                aria-hidden
                className="flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 border-clay bg-paper text-xs font-semibold text-clay sm:h-7 sm:w-7"
              >
                {i + 1}
              </span>
              <p className="font-display text-lg font-semibold text-ink sm:mt-4">
                {step.label}
              </p>
            </div>
            <p className="mt-2 pl-9 text-base leading-relaxed text-ink-soft sm:pl-0">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
