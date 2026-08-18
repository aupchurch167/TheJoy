import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getPhotos } from "@/lib/photos";
import { storageEnabled } from "@/lib/storage";
import { aiEnabled } from "@/lib/ai";
import { SITE_PHOTO_SLOTS, getSitePhotoOverrides } from "@/lib/site-photos";
import { PageHeader, ButtonLink, NotConnected } from "@/components/admin/ui";
import GalleryManager from "../gallery/GalleryManager";
import PhotosManager from "../photos/PhotosManager";

export const dynamic = "force-dynamic";

type Tab = "gallery" | "site-photos";

function StorageWarning({ uploadsOnly }: { uploadsOnly?: boolean }) {
  if (storageEnabled()) return null;
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
      <span aria-hidden>⚠️</span>
      <p>
        Photo {uploadsOnly ? <strong>uploads</strong> : "uploads"} need storage
        set up (S3 / Cloudflare R2). Until then, you can still add photos by
        pasting an image URL (see OPERATIONS.md).
      </p>
    </div>
  );
}

/** Segmented control toggling the two media sections (a URL param keeps it simple). */
function Tabs({ tab }: { tab: Tab }) {
  const item = (value: Tab, label: string) => {
    const active = tab === value;
    return (
      <Link
        href={`/admin/media?tab=${value}`}
        aria-current={active ? "page" : undefined}
        className={`rounded-lg px-[18px] py-2 text-sm font-semibold transition-colors ${
          active
            ? "bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
            : "text-ink-soft hover:text-ink"
        }`}
      >
        {label}
      </Link>
    );
  };
  return (
    <div className="mb-6 inline-flex gap-[3px] rounded-[11px] bg-surface p-[3px]">
      {item("gallery", "Public gallery")}
      {item("site-photos", "Site photos & logo")}
    </div>
  );
}

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const tab: Tab = sp.tab === "site-photos" ? "site-photos" : "gallery";

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Media" />
        <NotConnected what="Media" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Media"
        description="Your public gallery and the photos and logo across the site. Real photos only, no stock."
        actions={
          tab === "gallery" ? (
            <ButtonLink href="/gallery" variant="secondary" size="sm" target="_blank">
              View public gallery
            </ButtonLink>
          ) : (
            <ButtonLink href="/" variant="secondary" size="sm" target="_blank">
              View site
            </ButtonLink>
          )
        }
      />

      <Tabs tab={tab} />

      {tab === "gallery" ? (
        <GallerySection />
      ) : (
        <SitePhotosSection />
      )}
    </>
  );
}

async function GallerySection() {
  const photos = await getPhotos();
  return (
    <>
      <StorageWarning />
      <GalleryManager photos={photos} aiReady={aiEnabled()} />
    </>
  );
}

async function SitePhotosSection() {
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
    contain: s.contain ?? false,
    group: s.group,
  }));
  return (
    <>
      <StorageWarning uploadsOnly />
      <PhotosManager slots={slots} canUpload={storageEnabled()} />
    </>
  );
}
