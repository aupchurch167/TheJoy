import {
  DCH_INSPECTION_LINK_LABEL,
  DCH_INSPECTION_SEARCH,
  DCH_LICENSE_STATEMENT,
  DCH_REPORTS,
  DCH_REPORTS_LEDE,
} from "@/lib/site";

/**
 * Homepage trust block for Georgia DCH rule 111-8-62-.11(4): the license
 * statement plus direct links to inspection reports from the past 18 months.
 * States only the license and the report names. No result claims.
 */
export default function LicensedInspected() {
  return (
    <section
      aria-labelledby="licensed-heading"
      className="border-b border-line bg-white/70"
    >
      <div className="mx-auto max-w-3xl px-5 py-8 sm:py-10">
        <h2
          id="licensed-heading"
          className="font-display text-2xl font-semibold text-ink"
        >
          Licensed and inspected
        </h2>
        <p className="mt-3 max-w-[46em] text-base leading-relaxed text-ink-soft">
          {DCH_LICENSE_STATEMENT}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          {DCH_REPORTS_LEDE}
        </p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {DCH_REPORTS.map((report) => (
            <li key={report.href}>
              <a
                href={report.href}
                target="_blank"
                rel="noopener"
                className="text-clay-dark underline decoration-line underline-offset-4 hover:text-clay"
              >
                {report.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          <a
            href={DCH_INSPECTION_SEARCH}
            target="_blank"
            rel="noopener"
            className="text-clay-dark underline decoration-line underline-offset-4 hover:text-clay"
          >
            {DCH_INSPECTION_LINK_LABEL}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </div>
    </section>
  );
}
