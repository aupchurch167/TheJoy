/**
 * A visual, numbered timeline: a horizontal track on wide screens, a vertical
 * one on mobile. Static (no interactivity), real content only. Used for the
 * memory-care "steady day" and each service's "what to expect" rhythm.
 */
export default function StepTimeline({
  heading,
  lede,
  steps,
}: {
  heading: string;
  lede?: string;
  steps: { label: string; body: string }[];
}) {
  const cols =
    steps.length >= 4
      ? "sm:grid-cols-4"
      : steps.length === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2";

  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        {heading}
      </h2>
      {lede && (
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">{lede}</p>
      )}

      <ol className={`mt-8 grid gap-6 ${cols} sm:gap-4`}>
        {steps.map((step, i) => (
          <li key={step.label} className="relative">
            {/* Connector line between nodes (horizontal on desktop). */}
            {i < steps.length - 1 && (
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
