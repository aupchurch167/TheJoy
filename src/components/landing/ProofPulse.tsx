import { BADGES, MEMORY_CARE } from "@/lib/site";
import { getSitePhotos } from "@/lib/site-photos";
import Photo from "@/components/Photo";

/**
 * The "proof pulse": Mellissa's portrait + one line of credibility + the award
 * badges, in a wrapping row. Reused across the landing pages. Names Mellissa
 * (§2) and uses the real award files; the memory-care badge only shows when
 * memory care is offered (§4).
 */
export default async function ProofPulse({
  caption = "She gives every tour herself.",
  alt,
  src,
}: {
  caption?: string;
  alt?: string;
  src?: string;
}) {
  const { mellissa } = await getSitePhotos();
  const badges = BADGES.filter((b) => !b.requiresMemoryCare || MEMORY_CARE.enabled);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-5">
      <Photo
        src={src || mellissa.src}
        alt={alt || mellissa.alt}
        rounded="rounded-full"
        className="h-24 w-24 flex-none ring-1 ring-line"
        sizes="96px"
      />
      <p className="min-w-[15rem] flex-1 text-lg leading-relaxed text-ink-soft">
        <strong className="text-ink">Mellissa Daniel, Executive Director.</strong>{" "}
        {caption}
      </p>
      {badges.length > 0 && (
        <div className="flex flex-none items-center gap-3">
          {badges.map((b) => (
            // Plain <img>: a badge can come straight from the awarding site
            // (Enjoy), which next/image would refuse or cache past a change.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={b.src}
              src={b.src}
              alt={b.alt}
              loading="lazy"
              decoding="async"
              className="h-16 w-16 object-contain"
            />
          ))}
        </div>
      )}
    </div>
  );
}
