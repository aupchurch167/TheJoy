import type { Metadata } from "next";
import { BUSINESS, OG_IMAGE } from "@/lib/site";
import { pageTwitter } from "@/lib/metadata";
import { hasDatabase } from "@/lib/db";
import { getPhotos } from "@/lib/photos";
import Photo from "@/components/Photo";

export const dynamic = "force-dynamic";

const GALLERY_TITLE = "Photos of The Joy, a Personal Care Home in Loganville, GA";
const GALLERY_DESCRIPTION =
  "Real photos from The Joy Senior Living, a small personal care home with memory care in Loganville, GA. Cookouts, holiday meals and everyday afternoons.";

export const metadata: Metadata = pageTwitter({
  title: { absolute: GALLERY_TITLE },
  description: GALLERY_DESCRIPTION,
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: GALLERY_TITLE,
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
        Life at The Joy
      </h1>
      <div className="mt-4 max-w-2xl space-y-4 text-lg leading-relaxed text-ink-soft">
        <p>
          These are real photos from The Joy, taken on ordinary days and a few
          holidays. We didn&apos;t stage them, and there are no stock pictures
          here.
        </p>
        <p>
          You&apos;ll see a cookout under the covered patio, with long tables
          and trees behind it. You&apos;ll see red, white and blue outfits in
          the summer and paper leaves on the table at a fall meal. There&apos;s
          a hug on the couch and a lot of people leaning in close for the
          camera.
        </p>
        <p>
          Photos only show so much. When you tour, you&apos;ll walk through the
          same rooms and meet the people who spend their days here. Ask Mellissa
          about anything you see on this page. Call{" "}
          <a href={BUSINESS.phoneHref} className="font-semibold text-clay">
            {BUSINESS.phone}
          </a>{" "}
          to set up a visit.
        </p>
      </div>

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
