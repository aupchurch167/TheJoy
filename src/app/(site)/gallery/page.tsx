import type { Metadata } from "next";
import { BUSINESS } from "@/lib/site";
import { hasDatabase } from "@/lib/db";
import { getPhotos } from "@/lib/photos";
import Photo from "@/components/Photo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Photos",
  description:
    "Real photos from Joy Senior Living, a small personal care home in Loganville, Georgia.",
  alternates: { canonical: "/gallery" },
};

export default async function PublicGalleryPage() {
  const photos = hasDatabase() ? await getPhotos() : [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="font-display text-4xl font-semibold text-ink">
        Life at Joy
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">
        Real moments from the home, the porch, and the people who live and work
        here. No stock, no staging.
      </p>

      {photos.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-line bg-white px-6 py-10 text-center text-ink-soft">
          Photos are on the way. In the meantime, the best way to see Joy is to
          come by. Call {BUSINESS.director.name} at{" "}
          <a href={BUSINESS.phoneHref} className="font-semibold text-clay">
            {BUSINESS.phone}
          </a>
          .
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <figure key={p.id} className="overflow-hidden">
              <Photo
                src={p.image_url}
                alt={p.image_alt || p.caption || "A photo from Joy Senior Living"}
                className="aspect-square w-full ring-1 ring-line"
              />
              {p.caption && (
                <figcaption className="mt-2 text-sm text-ink-soft">
                  {p.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
