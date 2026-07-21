import { MELLISSA } from "@/lib/site";
import Photo from "@/components/Photo";

export default function MeetMellissa() {
  return (
    <section id="mellissa" className="py-16 sm:py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-5 sm:grid-cols-[minmax(0,320px)_1fr]">
        <Photo
          src={MELLISSA.photo}
          alt={`${MELLISSA.heading}, Executive Director at Joy Senior Living`}
          className="aspect-[4/5] w-full ring-1 ring-line"
        />

        <div>
          <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            {MELLISSA.heading}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            {MELLISSA.intro}
          </p>

          {/* Only renders when Mellissa's own words are provided (§ do not
              fabricate). Empty string = hidden. */}
          {MELLISSA.quote.trim() !== "" && (
            <blockquote className="mt-6 border-l-2 border-clay pl-5">
              <p className="font-display text-xl italic leading-relaxed text-ink">
                {MELLISSA.quote}
              </p>
              <footer className="mt-3 text-sm font-medium text-ink-faint">
                {MELLISSA.heading}, Executive Director
              </footer>
            </blockquote>
          )}
        </div>
      </div>
    </section>
  );
}
