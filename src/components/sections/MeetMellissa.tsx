import { MELLISSA } from "@/lib/site";
import { getSitePhotos } from "@/lib/site-photos";
import Photo from "@/components/Photo";

export default async function MeetMellissa() {
  const { mellissa } = await getSitePhotos();
  return (
    <section id="mellissa" className="py-16 sm:py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-5 sm:grid-cols-[minmax(0,320px)_1fr]">
        <Photo
          src={mellissa.src}
          alt={mellissa.alt}
          className="aspect-[4/5] w-full ring-1 ring-line"
        />

        <div>
          <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            {MELLISSA.heading}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            {MELLISSA.intro}
          </p>

          {/* Owner-supplied story. Hidden until real paragraphs are added
              (§ do not fabricate). */}
          {MELLISSA.story.length > 0 && (
            <div className="mt-4 space-y-4 text-lg leading-relaxed text-ink-soft">
              {MELLISSA.story.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

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
