import { AWARD, HERO, HERO_PHOTO } from "@/lib/site";
import Photo from "@/components/Photo";
import TourButton from "@/components/TourButton";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-2 lg:py-20">
        <div>
          {/* Award badge, moved up near the hero per the teardown notes. */}
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white px-4 py-1.5 text-sm font-medium text-gold">
            <span aria-hidden="true">★</span>
            {AWARD.year} {AWARD.label}
          </p>

          <h1 className="font-display text-4xl font-semibold leading-[1.1] text-ink sm:text-5xl">
            {HERO.headline}
          </h1>

          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
            {HERO.sub}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <TourButton>{HERO.ctaLabel}</TourButton>
            <a
              href="#difference"
              className="text-base font-semibold text-clay hover:text-clay-dark"
            >
              See what makes Joy different
            </a>
          </div>
        </div>

        <div className="relative">
          <Photo
            src={HERO_PHOTO.src}
            alt={HERO_PHOTO.alt}
            priority
            className="aspect-[4/3] w-full shadow-sm ring-1 ring-line"
          />
        </div>
      </div>
    </section>
  );
}
