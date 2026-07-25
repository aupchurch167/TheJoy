import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getPhotos } from "@/lib/photos";
import { storageEnabled } from "@/lib/storage";
import GalleryManager from "./GalleryManager";
import { PageHeader, ButtonLink, NotConnected } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Gallery" />
        <NotConnected what="The gallery" />
      </>
    );
  }

  const photos = await getPhotos();

  return (
    <>
      <PageHeader
        title="Gallery"
        description="Real photos of Joy for the public gallery. No stock imagery."
        actions={
          <ButtonLink href="/gallery" variant="secondary" size="sm" target="_blank">
            View public gallery
          </ButtonLink>
        }
      />

      {!storageEnabled() && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          <span aria-hidden>⚠️</span>
          <p>
            Photo uploads need storage set up (S3 / Cloudflare R2). Until then,
            you can still add photos by pasting an image URL (see OPERATIONS.md).
          </p>
        </div>
      )}

      <GalleryManager photos={photos} />
    </>
  );
}
