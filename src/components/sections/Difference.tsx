import { BUSINESS, DIFFERENCE } from "@/lib/site";

export default function Difference() {
  return (
    <section id="difference" className="py-16 sm:py-20">
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

        <p className="mt-8 text-base font-medium text-ink">
          Joy is a personal care home in {BUSINESS.address.city}, Georgia, with
          room for {BUSINESS.beds} residents.
        </p>
      </div>
    </section>
  );
}
