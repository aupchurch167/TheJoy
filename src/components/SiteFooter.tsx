import Link from "next/link";
import { BUSINESS, SOCIAL, BADGES, MEMORY_CARE, ENJOY_HANDOFF, SITE_URL } from "@/lib/site";
import { getSettings, toTelHref, toMailHref } from "@/lib/settings";
import { getSitePhotos } from "@/lib/site-photos";

export default async function SiteFooter() {
  const [settings, { logo }] = await Promise.all([
    getSettings(),
    getSitePhotos(),
  ]);
  const year = 2026; // update yearly; kept static to avoid build-time drift
  const badges = BADGES.filter(
    (b) => !b.requiresMemoryCare || MEMORY_CARE.enabled
  );

  return (
    <footer className="border-t border-line bg-white/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link
            href="/"
            aria-label={`${BUSINESS.name} home`}
            className="inline-flex items-center"
          >
            {logo.set ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo.src} alt={BUSINESS.name} className="h-10 w-auto" />
            ) : (
              <span className="font-display text-lg font-semibold text-ink">
                {BUSINESS.name}
              </span>
            )}
          </Link>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            A senior living home and memory care (personal care home) in
            Loganville, Georgia. Small enough to know your parent by name.
          </p>
          {SOCIAL.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-ink">Follow along</p>
              <ul className="mt-2 flex gap-4 text-sm text-ink-soft">
                {SOCIAL.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-clay"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="text-sm text-ink-soft">
          <p className="font-semibold text-ink">Visit or call</p>
          <address className="mt-2 not-italic leading-relaxed">
            {BUSINESS.listingName}
            <br />
            {settings.address}
            <br />
            <a href={toTelHref(settings.phone)} className="hover:text-clay">
              {settings.phone}
            </a>
            <br />
            <a href={toMailHref(settings.email)} className="hover:text-clay">
              {settings.email}
            </a>
            <br />
            <a href={SITE_URL} className="hover:text-clay">
              {BUSINESS.website}
            </a>
          </address>
        </div>

        <div className="text-sm text-ink-soft">
          <p className="font-semibold text-ink">On this site</p>
          <ul className="mt-2 space-y-1.5">
            <li>
              <Link href="/about" className="hover:text-clay">
                About
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-clay">
                Services
              </Link>
            </li>
            {MEMORY_CARE.enabled && (
              <li>
                <Link href="/memory-care" className="hover:text-clay">
                  Memory Care
                </Link>
              </li>
            )}
            <li>
              <Link href="/blog" className="hover:text-clay">
                Stories from Joy
              </Link>
            </li>
            <li>
              <Link href="/gallery" className="hover:text-clay">
                Photos
              </Link>
            </li>
            <li>
              <Link href="/partners" className="hover:text-clay">
                For professionals
              </Link>
            </li>
            {settings.careers_url && (
              <li>
                <a
                  href={settings.careers_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-clay"
                >
                  Careers
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="text-sm text-ink-soft">
          <p className="font-semibold text-ink">For families</p>
          <ul className="mt-2 space-y-1.5">
            <li>
              <Link href="/cost" className="hover:text-clay">
                What it costs
              </Link>
            </li>
            <li>
              <Link href="/reviews" className="hover:text-clay">
                Reviews
              </Link>
            </li>
            <li>
              <Link href="/when-its-time" className="hover:text-clay">
                When it&rsquo;s time
              </Link>
            </li>
            <li>
              <Link href="/tour-checklist" className="hover:text-clay">
                Tour checklist
              </Link>
            </li>
            <li>
              <Link href="/small-home-difference" className="hover:text-clay">
                The small-home difference
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line/70">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <p className="font-semibold text-ink">{ENJOY_HANDOFF.heading}</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
            {ENJOY_HANDOFF.before}{" "}
            <a
              href={ENJOY_HANDOFF.careCheck.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-clay hover:underline"
            >
              {ENJOY_HANDOFF.careCheck.label}
            </a>{" "}
            {ENJOY_HANDOFF.between}{" "}
            <a
              href={ENJOY_HANDOFF.listing.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-clay hover:underline"
            >
              {ENJOY_HANDOFF.listing.label}
            </a>{" "}
            {ENJOY_HANDOFF.after}
          </p>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="border-t border-line/70">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 px-5 py-6 sm:gap-10">
            {badges.map((b) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={b.src}
                src={b.src}
                alt={b.alt}
                loading="lazy"
                decoding="async"
                className="h-16 w-auto"
              />
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-line/70">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-ink-faint">
          &copy; {year} {BUSINESS.listingName}. Licensed as a personal care home in the
          State of Georgia. {settings.address}.
        </p>
      </div>
    </footer>
  );
}
