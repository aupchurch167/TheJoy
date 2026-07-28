import { FAQ, MEMORY_CARE } from "@/lib/site";

/**
 * Homepage FAQ. Plain answers to the questions families ask. The memory-care
 * item is hidden unless memory care is offered (§4). Cost and openings answer
 * with a call, not an invented number.
 */
export default function Faq() {
  const items = FAQ.filter((f) => f.gated !== "memory" || MEMORY_CARE.enabled);

  return (
    <section id="faq" className="py-16 sm:py-20">
      <div className="mx-auto max-w-2xl px-5">
        <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          Questions families ask
        </h2>

        <dl className="mt-8 divide-y divide-line">
          {items.map((item) => (
            <div key={item.q} className="py-6 first:pt-0">
              <dt className="font-display text-xl font-semibold text-ink">
                {item.q}
              </dt>
              <dd className="mt-3 text-lg leading-relaxed text-ink-soft">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
