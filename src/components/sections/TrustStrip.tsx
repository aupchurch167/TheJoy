import { TRUST_STRIP } from "@/lib/site";

/**
 * Thin bar of plain, verifiable facts under the hero. No reassurance language,
 * just the license, the size, the staffing, and the address.
 */
export default function TrustStrip() {
  return (
    <div className="border-y border-line bg-white/70">
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-5 py-3 text-center text-sm text-ink-soft sm:gap-x-4">
        {TRUST_STRIP.map((item, i) => (
          <li key={item} className="flex items-center gap-3 sm:gap-4">
            {i > 0 && (
              <span aria-hidden className="text-ink-faint">
                &middot;
              </span>
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
