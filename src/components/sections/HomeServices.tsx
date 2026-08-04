import { HOME_SERVICES, MEMORY_CARE } from "@/lib/site";
import { getSitePhotos } from "@/lib/site-photos";
import Photo from "@/components/Photo";

/**
 * "What we handle" — the daily work of care, stated plainly. A short, specific
 * list (not an icon grid, not reassurance filler). The memory-care line only
 * appears while memory care is offered (§4). The photo is admin-editable
 * (Site Photos > What we handle).
 */
export default async function HomeServices() {
  const items = [
    ...HOME_SERVICES.items,
    ...(MEMORY_CARE.enabled ? [HOME_SERVICES.memoryItem] : []),
  ];
  const { homeServices } = await getSitePhotos();

  return (
    <section id="services" className="bg-white/60 py-16 sm:py-20">
      <div className="mx-auto grid max-w-5xl items-start gap-10 px-5 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-clay">
            Personal care, day to day
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
            {HOME_SERVICES.heading}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            {HOME_SERVICES.lede}
          </p>

          <ul className="mt-8 grid gap-y-3">
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

        <div className="lg:sticky lg:top-24">
          <Photo
            src={homeServices.src}
            alt={homeServices.alt}
            className="aspect-[4/5] w-full ring-1 ring-line"
          />
        </div>
      </div>
    </section>
  );
}
