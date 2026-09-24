import type { Metadata } from "next";
import { BUSINESS, OG_IMAGE } from "@/lib/site";
import { pageTwitter } from "@/lib/metadata";
import { hasDatabase } from "@/lib/db";
import { getPhotos } from "@/lib/photos";
import Photo from "@/components/Photo";

export const dynamic = "force-dynamic";

// Title stays "Photos" so the tab title (template appends the brand) does not
// change. Open Graph was inheriting the homepage title, description, and URL.
const GALLERY_DESCRIPTION =
  "See real photos of The Joy Senior Living, a small personal care home with memory care in Loganville, GA. The home, the porch, our people. No stock, no staging.";

export const metadata: Metadata = pageTwitter({
  title: "Photos",
  description: GALLERY_DESCRIPTION,
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: `Photos | ${BUSINESS.name}`,
    description: GALLERY_DESCRIPTION,
    url: "/gallery",
    type: "website",
    siteName: BUSINESS.name,
    locale: "en_US",
    images: [OG_IMAGE],
  },
});

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
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 288px"
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
