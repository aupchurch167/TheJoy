import { OBJECTION } from "@/lib/site";

/**
 * Objection handler. Answers the fear behind "small" and, honestly, names who
 * Joy is NOT right for. Keeps §4 straight: personal care home, not a nursing
 * home.
 */
export default function Objection() {
  return (
    <section className="bg-sage/10 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl px-5">
        <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          {OBJECTION.heading}
        </h2>
        <div className="mt-6 space-y-5 text-lg leading-relaxed text-ink-soft">
          {OBJECTION.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
