import { getSitePhotos } from "@/lib/site-photos";
import Photo from "@/components/Photo";

export default async function CommunityPhotos() {
  const { community } = await getSitePhotos();
  if (community.length === 0) return null;

  return (
    <section id="community" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          Inside the home
        </h2>
        <p className="mt-3 max-w-xl text-lg text-ink-soft">
          Real photos of the building, the rooms, and the people who live and
          work here. No stock, no staging.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {community.map((p, i) => (
            <Photo
              key={i}
              src={p.src}
              alt={p.alt}
              className="aspect-square w-full ring-1 ring-line"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
