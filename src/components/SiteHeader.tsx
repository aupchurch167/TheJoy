import Link from "next/link";
import { BUSINESS } from "@/lib/site";
import TourButton from "./TourButton";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="font-display text-xl font-semibold text-ink">
            {BUSINESS.name}
          </span>
          <span className="text-xs text-ink-faint">
            Loganville, Georgia
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <a
            href={BUSINESS.phoneHref}
            className="hidden text-sm font-medium text-ink-soft hover:text-clay sm:inline"
          >
            {BUSINESS.phone}
          </a>
          <TourButton className="px-5 py-2.5 text-sm">Book a tour</TourButton>
        </div>
      </div>
    </header>
  );
}
