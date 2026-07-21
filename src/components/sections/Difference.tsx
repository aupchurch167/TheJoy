import {
  ASSISTED_LIVING_CONTEXT,
  BUSINESS,
  DIFFERENCE,
  MEMORY_CARE,
} from "@/lib/site";

export default function Difference() {
  return (
    <section id="difference" className="bg-white/60 py-16 sm:py-20">
      <div className="prose-joy mx-auto max-w-2xl px-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-clay">
          The difference
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
          {DIFFERENCE.heading}
        </h2>

        <div className="mt-6 space-y-5 text-lg text-ink-soft">
          {DIFFERENCE.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {MEMORY_CARE.enabled && (
          <div className="mt-10">
            <h3 className="font-display text-2xl font-semibold text-ink">
              {MEMORY_CARE.heading}
            </h3>
            <p className="mt-3 text-lg text-ink-soft">{MEMORY_CARE.body}</p>
          </div>
        )}

        {/* Search-context framing. Appears for "assisted living Loganville"
            searches without ever labeling Joy assisted living (§4). */}
        <p className="mt-10 border-l-2 border-line pl-5 text-base leading-relaxed text-ink-faint">
          {ASSISTED_LIVING_CONTEXT.body}
        </p>

        <p className="mt-8 text-base font-medium text-ink">
          Joy is a personal care home in {BUSINESS.address.city}, Georgia, with
          room for {BUSINESS.beds} residents.
        </p>
      </div>
    </section>
  );
}
