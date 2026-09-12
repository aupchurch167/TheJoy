import type { Metadata } from "next";
import { existsSync } from "fs";
import { join } from "path";
import {
  BUSINESS,
  BUSINESS_ADDRESS_ONE_LINE,
  OG_IMAGE,
  MEMORY_CARE,
} from "@/lib/site";
import { breadcrumbJsonLd } from "@/lib/schema";
import JsonLd from "@/components/JsonLd";

// Services line, gated on memory care staying within the license (§4).
const SERVICES_LINE = MEMORY_CARE.enabled
  ? "personal care, memory care, and respite"
  : "personal care and respite";

export const metadata: Metadata = {
  title: { absolute: "For Professionals | Joy Senior Living of Loganville" },
  description: `Partner materials for case managers and placement agencies: ${SERVICES_LINE} at The Joy in Loganville, GA.`,
  alternates: { canonical: "/partners" },
  openGraph: {
    title: "For Professionals | Joy Senior Living of Loganville",
    description: `Partner materials for case managers and placement agencies: ${SERVICES_LINE} at The Joy in Loganville, GA.`,
    url: "/partners",
    type: "website",
    images: [OG_IMAGE],
  },
};

/**
 * Resolve the first filename that actually exists in public/partners, so a
 * missing PDF shows a "being finalized" note instead of a broken download link.
 * Checked at build time; drop the file in and redeploy and the button appears.
 */
function pdfHref(names: string[]): string | null {
  for (const n of names) {
    if (existsSync(join(process.cwd(), "public", "partners", n))) {
      return `/partners/${n}`;
    }
  }
  return null;
}

const DOWNLOADS = [
  {
    label: "Partner Fact Sheet",
    blurb:
      "An overview of Joy, who we are a good fit for, and a short admissions cheat sheet. One page to keep by the phone.",
    names: ["partner-fact-sheet.pdf", "partner-packet.pdf"],
  },
  {
    label: "Rate Card",
    blurb:
      "Current rates and fees, written plainly. What the number covers, so there are no surprises at move-in.",
    names: ["rate-card.pdf"],
  },
  {
    label: "Photo Tour",
    blurb:
      "Real photos of the house, the suites, and the yard. No stock, no staging, just the rooms as they are.",
    names: ["photo-tour.pdf"],
  },
];

const GOOD_FIT = [
  "Help with daily activities (bathing, dressing, grooming)",
  "Medication management",
  "Memory loss, wandering, or sundowning risk",
  "Fall risk that needs a small, single-story setting",
  "Failure to thrive at home",
  "Post-hospital respite and recovery",
  "Caregiver burnout at home",
];

const NOT_FIT = [
  "Ventilators, IVs, wound vacs, or feeding tubes",
  "Total mechanical lift or no weight-bearing",
  "Active psychiatric crisis or behaviors unsafe in a small home",
  "Care beyond what a Georgia personal care home is licensed to provide",
];

const FACTS = [
  "Georgia Personal Care Home, DCH-surveyed",
  `${BUSINESS.beds} private suites with private baths`,
  MEMORY_CARE.enabled
    ? "Personal care, memory care, and respite"
    : "Personal care and respite",
  `24/7 awake staff, RN Executive Director (${BUSINESS.director.name})`,
  "Hospice and home health welcome in-house",
  BUSINESS_ADDRESS_ONE_LINE,
  "~15 min Piedmont Walton · ~20 min Piedmont Eastside · ~30 min Northside Gwinnett",
];

const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-clay px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-clay-dark";
const btnSecondary =
  "inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-base font-semibold text-clay ring-1 ring-clay/30 transition-colors hover:bg-clay/5";

export default function PartnersPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "For professionals", path: "/partners" },
        ])}
      />

      {/* Hero */}
      <section className="mx-auto max-w-2xl px-5 pt-14 pb-8 sm:pt-20">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-faint">
          For professionals
        </p>
        <h1 className="mt-4 max-w-[18ch] font-display text-4xl font-semibold text-ink text-balance sm:text-5xl">
          Materials for the people who make the referral.
        </h1>
        <p className="mt-5 max-w-[38em] text-lg leading-relaxed text-ink-soft">
          For case managers, discharge planners, and placement partners referring
          to The Joy Senior Living of Loganville, a Georgia-licensed personal care
          home ({BUSINESS.beds} private suites) with {SERVICES_LINE}.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href={BUSINESS.phoneHref} className={btnPrimary}>
            Call {BUSINESS.phone}
          </a>
          <a href={BUSINESS.emailHref} className={btnSecondary}>
            {BUSINESS.email}
          </a>
        </div>
        <p className="mt-3 text-sm text-ink-faint">Call or text, either works.</p>
      </section>

      {/* Quick facts */}
      <section className="border-y border-line bg-surface py-14 sm:py-16">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            The quick facts
          </h2>
          <ul className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {FACTS.map((f) => (
              <li key={f} className="flex gap-3 text-lg leading-relaxed text-ink-soft">
                <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-clay" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Clinical fit */}
      <section className="mx-auto max-w-4xl px-5 py-16">
        <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          Who we can help, and who we can&rsquo;t
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-6 sm:p-7">
            <h3 className="font-display text-xl font-semibold text-ink">
              A good fit
            </h3>
            <ul className="mt-4 space-y-3">
              {GOOD_FIT.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 leading-relaxed text-ink-soft"
                >
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-clay" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
            <h3 className="font-display text-xl font-semibold text-ink">
              Not the right place
            </h3>
            <ul className="mt-4 space-y-3">
              {NOT_FIT.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 leading-relaxed text-ink-soft"
                >
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-ink-faint" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-8 border-l-[3px] border-clay pl-4 font-display text-xl leading-snug text-ink text-pretty">
          We are a personal care home, not a nursing home. If we&rsquo;re not the
          right fit, we&rsquo;ll say so fast.
        </p>
      </section>

      {/* Downloads */}
      <section className="border-y border-line bg-surface py-16">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            Partner materials
          </h2>
          <p className="mt-3 max-w-[42em] text-lg leading-relaxed text-ink-soft">
            No form, no gate. Download what you need and send it along.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {DOWNLOADS.map((d) => {
              const href = pdfHref(d.names);
              return (
              <div
                key={d.label}
                className="flex flex-col rounded-2xl border border-line bg-white p-6"
              >
                <h3 className="font-display text-lg font-semibold text-ink">
                  {d.label}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
                  {d.blurb}
                </p>
                <div className="mt-5">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-clay-dark"
                    >
                      Download PDF
                    </a>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-surface px-4 py-2.5 text-sm font-medium text-ink-faint ring-1 ring-line">
                      Being finalized, call and we&rsquo;ll send it
                    </span>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How to refer */}
      <section className="mx-auto max-w-4xl px-5 py-16">
        <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          How to refer
        </h2>
        <div className="mt-8 grid gap-8 md:grid-cols-[1.3fr_1fr]">
          <ol className="space-y-4">
            {[
              [
                "Call to start",
                <>
                  Call{" "}
                  <a
                    href={BUSINESS.phoneHref}
                    className="font-semibold text-clay hover:text-clay-dark"
                  >
                    {BUSINESS.phone}
                  </a>
                  . Same-day assessment when possible, and we can come to the
                  bedside.
                </>,
              ],
              [
                "Yes or no within hours",
                "We read the situation honestly and tell you quickly. Often a next-day move-in.",
              ],
              [
                "Day-7 follow-up",
                `${BUSINESS.director.name} checks in with the family a week after move-in to see how it is really going.`,
              ],
              [
                "Not ready to commit?",
                "Respite is a real option. Families can start with a short stay and decide from there.",
              ],
            ].map(([title, body], i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-clay/10 font-display text-sm font-semibold text-clay-dark">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-ink">{title}</p>
                  <p className="mt-1 leading-relaxed text-ink-soft">{body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="rounded-2xl border border-line bg-white p-6">
            <h3 className="font-display text-lg font-semibold text-ink">
              Send a referral
            </h3>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-ink">Call or text</dt>
                <dd className="mt-0.5">
                  <a
                    href={BUSINESS.phoneHref}
                    className="text-clay hover:text-clay-dark"
                  >
                    {BUSINESS.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Secure fax</dt>
                <dd className="mt-0.5 text-ink-soft">{BUSINESS.fax}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Email</dt>
                <dd className="mt-0.5">
                  <a
                    href={BUSINESS.emailHref}
                    className="text-clay hover:text-clay-dark"
                  >
                    {BUSINESS.email}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Contacts */}
      <section className="border-t border-line bg-surface py-16">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            Who you&rsquo;ll be talking to
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-line bg-white p-6 sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-wide text-clay">
                Tours &amp; assessments
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink">
                {BUSINESS.director.name}, RN
              </p>
              <p className="text-ink-soft">Executive Director</p>
              <div className="mt-4 space-y-1 text-sm">
                <p>
                  <a
                    href={BUSINESS.phoneHref}
                    className="text-clay hover:text-clay-dark"
                  >
                    {BUSINESS.phone}
                  </a>
                </p>
                <p>
                  <a
                    href={BUSINESS.emailHref}
                    className="text-clay hover:text-clay-dark"
                  >
                    {BUSINESS.email}
                  </a>
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-white p-6 sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-wide text-clay">
                Partnerships
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink">
                Adam Upchurch
              </p>
              <p className="text-ink-soft">Owner</p>
              <div className="mt-4 space-y-1 text-sm">
                <p>
                  <a
                    href={BUSINESS.emailHref}
                    className="text-clay hover:text-clay-dark"
                  >
                    {BUSINESS.email}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
