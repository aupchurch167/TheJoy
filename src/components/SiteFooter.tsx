import Link from "next/link";
import { BUSINESS, BUSINESS_ADDRESS_ONE_LINE } from "@/lib/site";

export default function SiteFooter() {
  const year = 2026; // update yearly; kept static to avoid build-time drift

  return (
    <footer className="border-t border-line bg-white/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">
            {BUSINESS.name}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            A senior living home and memory care (personal care home) in
            Loganville, Georgia. Small enough to know your parent by name.
          </p>
        </div>

        <div className="text-sm text-ink-soft">
          <p className="font-semibold text-ink">Visit or call</p>
          <address className="mt-2 not-italic leading-relaxed">
            {BUSINESS.address.street}
            <br />
            {BUSINESS.address.city}, {BUSINESS.address.state}{" "}
            {BUSINESS.address.zip}
            <br />
            <a href={BUSINESS.phoneHref} className="hover:text-clay">
              {BUSINESS.phone}
            </a>
            <br />
            <a href={BUSINESS.emailHref} className="hover:text-clay">
              {BUSINESS.email}
            </a>
          </address>
        </div>

        <div className="text-sm text-ink-soft">
          <p className="font-semibold text-ink">On this site</p>
          <ul className="mt-2 space-y-1.5">
            <li>
              <Link href="/" className="hover:text-clay">
                Home
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-clay">
                Stories from Joy
              </Link>
            </li>
            <li>
              <a href={BUSINESS.phoneHref} className="hover:text-clay">
                Book a tour
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line/70">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-ink-faint">
          &copy; {year} {BUSINESS.name}. Licensed as a personal care home in the
          State of Georgia. {BUSINESS_ADDRESS_ONE_LINE}.
        </p>
      </div>
    </footer>
  );
}
