import { HOME_SERVICES, MEMORY_CARE } from "@/lib/site";

/**
 * "What we handle" — the daily work of care, stated plainly. A short, specific
 * list (not an icon grid, not reassurance filler). The memory-care line only
 * appears while memory care is offered (§4).
 */
export default function HomeServices() {
  const items = [
    ...HOME_SERVICES.items,
    ...(MEMORY_CARE.enabled ? [HOME_SERVICES.memoryItem] : []),
  ];

  return (
    <section id="services" className="bg-white/60 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-clay">
          Personal care, day to day
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
          {HOME_SERVICES.heading}
        </h2>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
          {HOME_SERVICES.lede}
        </p>

        <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 border-b border-line/70 pb-3 text-lg text-ink"
            >
              <span aria-hidden className="mt-1 text-clay">
                &#10003;
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-base leading-relaxed text-ink-faint">
          {HOME_SERVICES.note}
        </p>
      </div>
    </section>
  );
}
