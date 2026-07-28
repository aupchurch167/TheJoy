import { A_TUESDAY } from "@/lib/site";

/**
 * "A Tuesday at Joy" — a plain, specific picture of a day. Detail over
 * reassurance (§2). Prose blocks, not an icon grid.
 */
export default function ATuesday() {
  return (
    <section id="a-day" className="py-16 sm:py-20">
      <div className="mx-auto max-w-2xl px-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-clay">
          What the days look like
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
          {A_TUESDAY.heading}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          {A_TUESDAY.intro}
        </p>

        <dl className="mt-8 space-y-6">
          {A_TUESDAY.parts.map((part) => (
            <div
              key={part.label}
              className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-6"
            >
              <dt className="font-display text-lg font-semibold text-ink">
                {part.label}
              </dt>
              <dd className="text-lg leading-relaxed text-ink-soft">
                {part.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
