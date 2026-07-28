import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { storageEnabled } from "@/lib/storage";
import { SITE_PHOTO_SLOTS, getSitePhotoOverrides } from "@/lib/site-photos";
import { PageHeader, NotConnected, ButtonLink } from "@/components/admin/ui";
import PhotosManager from "./PhotosManager";

export const dynamic = "force-dynamic";

export default async function SitePhotosPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Site photos" />
        <NotConnected what="Site photos" />
      </>
    );
  }

  const overrides = await getSitePhotoOverrides();
  const slots = SITE_PHOTO_SLOTS.map((s) => ({
    key: s.key,
    settingKey: s.settingKey,
    label: s.label,
    hint: s.hint,
    alt: s.alt,
    aspect: s.aspect,
    defaultSrc: s.defaultSrc,
    current: overrides[s.settingKey] || "",
  }));

  return (
    <>
      <PageHeader
        title="Site photos"
        description="The main photos across your site (homepage, About, and each service). Upload a new one or paste an image URL; the site updates within a moment. Real photos only, no stock."
        actions={
          <ButtonLink href="/" variant="secondary" size="sm" target="_blank">
            View site
          </ButtonLink>
        }
      />

      {!storageEnabled() && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          <span aria-hidden>⚠️</span>
          <p>
            Photo <strong>uploads</strong> need storage set up (S3 / Cloudflare
            R2). Until then, paste an image URL in any slot below (see
            OPERATIONS.md).
          </p>
        </div>
      )}

      <PhotosManager slots={slots} canUpload={storageEnabled()} />
    </>
  );
}
