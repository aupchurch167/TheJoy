import { TESTIMONIALS, TESTIMONIAL_FEATURED } from "@/lib/site";

export default function Testimonials() {
  // Only real quotes ship. Empty ones are filtered out (never fabricate).
  const shown = TESTIMONIALS.filter((t) => t.quote.trim() !== "");
  if (shown.length === 0) return null;

  const featured = TESTIMONIAL_FEATURED.quote.trim() !== "";

  return (
    <section id="families" className="bg-white/60 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-5">
        <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          Hear from families
        </h2>

        {featured && (
          <figure className="mt-8 border-l-4 border-clay pl-6 sm:pl-8">
            <blockquote>
              <p className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                &ldquo;{TESTIMONIAL_FEATURED.quote}&rdquo;
              </p>
            </blockquote>
            <figcaption className="mt-4 text-base text-ink-soft">
              {TESTIMONIAL_FEATURED.attribution}
            </figcaption>
          </figure>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {shown.map((t, i) => (
            <figure
              key={i}
              className="flex flex-col rounded-2xl bg-white p-7 shadow-sm ring-1 ring-line"
            >
              <blockquote className="flex-1">
                <p className="font-display text-xl leading-relaxed text-ink">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </blockquote>
              <figcaption className="mt-5 text-sm text-ink-faint">
                <span className="font-semibold text-ink-soft">{t.name}</span>
                {t.context ? ` · ${t.context}` : ""}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
