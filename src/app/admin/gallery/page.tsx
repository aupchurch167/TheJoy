import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getPhotos } from "@/lib/photos";
import { storageEnabled } from "@/lib/storage";
import GalleryManager from "./GalleryManager";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-display text-2xl font-semibold text-ink">Gallery</h1>
        <p className="mt-4 rounded-lg bg-clay/10 px-4 py-3 text-clay-dark">
          The database is not connected yet.
        </p>
      </div>
    );
  }

  const photos = await getPhotos();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Gallery</h1>
        <Link
          href="/gallery"
          target="_blank"
          className="text-sm font-semibold text-clay hover:text-clay-dark"
        >
          View public gallery
        </Link>
      </div>
      <p className="mb-6 text-sm text-ink-soft">
        Real photos of Joy for the public gallery. No stock imagery.
      </p>

      {!storageEnabled() && (
        <p className="mb-6 rounded-lg bg-gold/10 px-4 py-3 text-sm text-gold">
          Photo uploads need storage set up (S3 / Cloudflare R2). Until then, you
          can still add photos by pasting an image URL (see OPERATIONS.md).
        </p>
      )}

      <GalleryManager photos={photos} />
    </div>
  );
}
