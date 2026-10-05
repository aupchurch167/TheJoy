import { BADGES, MEMORY_CARE } from "@/lib/site";

/**
 * Recognition strip: real third-party award badges. The memory-care badge only
 * shows when memory care is offered (§4). Renders nothing if there are no
 * badges to show.
 */
export default function Awards() {
  const badges = BADGES.filter(
    (b) => !b.requiresMemoryCare || MEMORY_CARE.enabled
  );
  if (badges.length === 0) return null;

  return (
    <section aria-labelledby="awards-heading" className="py-12 sm:py-14">
      <div className="mx-auto max-w-5xl px-5 text-center">
        <h2
          id="awards-heading"
          className="text-xs font-semibold uppercase tracking-wide text-ink-faint"
        >
          Recognized for our care
        </h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {badges.map((b) => {
            const img = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={b.src}
                alt={b.alt}
                loading="lazy"
                decoding="async"
                className="h-24 w-auto sm:h-28"
              />
            );
            // A followed link (no nofollow) so the award site gets the credit.
            return b.href ? (
              <a key={b.src} href={b.href} target="_blank" rel="noopener">
                {img}
              </a>
            ) : (
              <span key={b.src}>{img}</span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
