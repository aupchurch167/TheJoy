import { getSettings, tourHref, toTelHref } from "@/lib/settings";
import { BUSINESS } from "@/lib/site";
import TourButton from "@/components/TourButton";

/**
 * The landing-page CTA band: one headline, the single "Book a tour" action, a
 * "nothing to sign" reassurance line, and a quiet call-Mellissa link. Appears
 * a few times per page (README §Standing Components). `dark` renders the
 * full-bleed final band (ink background); otherwise a subtle surface band.
 *
 * The tour destination always goes through the site's ONE tour path
 * (tourHref + TourButton); we never add a second tour link (§ AGENTS.md).
 */
export default async function CtaBand({
  headline,
  dark = false,
}: {
  headline: string;
  dark?: boolean;
}) {
  const settings = await getSettings();
  const tour = tourHref(settings);
  const phone = settings.phone || BUSINESS.phone;

  if (dark) {
    return (
      <section className="bg-ink py-16 text-white sm:py-20">
        <div className="mx-auto max-w-2xl px-5">
          <h2 className="max-w-[22ch] font-display text-3xl font-semibold text-balance sm:text-4xl">
            {headline}
          </h2>
          <div className="mt-8">
            <TourButton variant="light" href={tour}>
              Book a tour
            </TourButton>
          </div>
          <p className="mt-4 text-sm text-white/60">
            No pressure and nothing to sign.
          </p>
          <p className="mt-2 text-white/90">
            Or call Mellissa at{" "}
            <a
              href={toTelHref(phone)}
              className="font-semibold underline decoration-white/40 underline-offset-4 hover:text-white"
            >
              {phone}
            </a>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-y border-line bg-surface py-14">
      <div className="mx-auto max-w-2xl px-5">
        <h2 className="max-w-[24ch] font-display text-2xl font-semibold text-ink text-balance sm:text-3xl">
          {headline}
        </h2>
        <div className="mt-6">
          <TourButton href={tour}>Book a tour</TourButton>
        </div>
        <p className="mt-3 text-sm text-ink-faint">
          No pressure and nothing to sign.
        </p>
        <p className="mt-2 text-ink-soft">
          Or call Mellissa at{" "}
          <a
            href={toTelHref(phone)}
            className="font-semibold text-clay hover:text-clay-dark"
          >
            {phone}
          </a>
        </p>
      </div>
    </section>
  );
}
