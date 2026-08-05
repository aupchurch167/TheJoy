import Link from "next/link";
import { BUSINESS, MEMORY_CARE } from "@/lib/site";
import { getSettings, toTelHref } from "@/lib/settings";
import { getSitePhotos } from "@/lib/site-photos";
import TourButton from "./TourButton";
import MobileNav from "./MobileNav";

// Memory Care sits in the nav only while it is offered within the license (§4).
const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  ...(MEMORY_CARE.enabled
    ? [{ href: "/memory-care", label: "Memory Care" }]
    : []),
  { href: "/blog", label: "Blog" },
];

export default async function SiteHeader() {
  const [settings, { logo, logoMark }] = await Promise.all([
    getSettings(),
    getSitePhotos(),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Link
          href="/"
          className="flex items-center"
          aria-label={`${BUSINESS.name} home`}
        >
          {logo.set ? (
            <>
              {/* Full logo on larger screens. eslint-disable-next-line @next/next/no-img-element */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo.src}
                alt={BUSINESS.name}
                className="hidden h-9 w-auto sm:block"
              />
              {/* Compact mark on mobile (falls back to the full logo if no mark). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoMark.set ? logoMark.src : logo.src}
                alt={BUSINESS.name}
                className="h-9 w-auto sm:hidden"
              />
            </>
          ) : (
            <span className="flex flex-col leading-tight">
              <span className="font-display text-xl font-semibold text-ink">
                {BUSINESS.name}
              </span>
              <span className="text-xs text-ink-faint">Loganville, Georgia</span>
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft lg:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-clay">
              {item.label}
            </Link>
          ))}
          {settings.careers_url && (
            <a
              href={settings.careers_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-clay"
            >
              Careers
            </a>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <a
            href={toTelHref(settings.phone)}
            className="hidden text-sm font-medium text-ink-soft hover:text-clay sm:inline"
          >
            {settings.phone}
          </a>
          <span className="hidden sm:inline-flex">
            <TourButton href={settings.talkfurther_url} className="px-5 py-2.5 text-sm">
              Book a tour
            </TourButton>
          </span>
          <MobileNav
            items={NAV}
            careersUrl={settings.careers_url}
            phone={settings.phone}
            phoneHref={toTelHref(settings.phone)}
            tourUrl={settings.talkfurther_url}
          />
        </div>
      </div>
    </header>
  );
}
