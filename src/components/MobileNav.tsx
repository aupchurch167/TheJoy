"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TourButton from "./TourButton";

/**
 * Mobile navigation for the public site: a hamburger button that opens a
 * dropdown panel with the nav links, phone, and the tour CTA. Hidden on
 * large screens, where the inline nav shows instead.
 */
export default function MobileNav({
  items,
  careersUrl,
  phone,
  phoneHref,
  tourUrl,
}: {
  items: { href: string; label: string }[];
  careersUrl?: string;
  phone: string;
  phoneHref: string;
  tourUrl?: string;
}) {
  const [open, setOpen] = useState(false);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-soft hover:bg-surface"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <>
          {/* Click-away overlay; sits below the header (z-40) and panel (z-50). */}
          <div
            className="fixed inset-0 z-30 bg-ink/20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="absolute inset-x-0 top-full z-50 border-b border-line bg-paper shadow-lg"
            onClick={(e) => {
              // Close when a link inside is tapped.
              if ((e.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            <nav className="mx-auto flex max-w-6xl flex-col px-5 py-3">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b border-line/60 py-3 text-base font-medium text-ink hover:text-clay"
                >
                  {item.label}
                </Link>
              ))}
              {careersUrl && (
                <a
                  href={careersUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-b border-line/60 py-3 text-base font-medium text-ink hover:text-clay"
                >
                  Careers
                </a>
              )}
              <a
                href={phoneHref}
                className="py-3 text-base font-medium text-ink-soft hover:text-clay"
              >
                {phone}
              </a>
              <div className="py-3">
                <TourButton href={tourUrl} className="w-full px-5 py-3 text-base">
                  Book a tour
                </TourButton>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
