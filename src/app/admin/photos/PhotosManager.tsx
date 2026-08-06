"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSitePhoto } from "./actions";
import { Card, Input, Button, Badge, SectionLabel } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import ImageCropper, { type AspectOption } from "@/components/admin/ImageCropper";
import { aspectRatioFromClass } from "@/lib/crop-image";

// Logos are cropped with a transparent (PNG) result and a choice of shapes, so
// an operator can trim whitespace without forcing a wide wordmark into a square.
const LOGO_ASPECTS: AspectOption[] = [
  { label: "Wide", value: 3 },
  { label: "Standard", value: 2 },
  { label: "Square", value: 1 },
];
const MARK_ASPECTS: AspectOption[] = [
  { label: "Square", value: 1 },
  { label: "Standard", value: 4 / 3 },
];

type Slot = {
  key: string;
  settingKey: string;
  label: string;
  hint: string;
  alt: string;
  aspect: string;
  defaultSrc: string;
  current: string;
  contain?: boolean;
  group: string;
};

export default function PhotosManager({
  slots,
  canUpload,
}: {
  slots: Slot[];
  canUpload: boolean;
}) {
  // Group slots into labeled sections, preserving order.
  const groups: { name: string; slots: Slot[] }[] = [];
  for (const s of slots) {
    let g = groups.find((x) => x.name === s.group);
    if (!g) {
      g = { name: s.group, slots: [] };
      groups.push(g);
    }
    g.slots.push(s);
  }

  return (
    <div className="space-y-10">
      {groups.map((g) => (
        <section key={g.name}>
          <SectionLabel>{g.name}</SectionLabel>
          <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {g.slots.map((slot) => (
              <PhotoSlotCard key={slot.key} slot={slot} canUpload={canUpload} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function PhotoSlotCard({ slot, canUpload }: { slot: Slot; canUpload: boolean }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(slot.current || slot.defaultSrc);
  const [uploading, setUploading] = useState(false);
  const [broken, setBroken] = useState(false);
  const [pending, start] = useTransition();
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);

  const usingDefault = !slot.current;
  const ratio = aspectRatioFromClass(slot.aspect);
  // Logos (contain slots) are croppable too, but as transparent PNGs with a
  // choice of shapes; photos crop to their fixed on-site aspect.
  const isLogo = Boolean(slot.contain);
  const aspectOptions = isLogo
    ? slot.key === "logo_mark"
      ? MARK_ASPECTS
      : LOGO_ASPECTS
    : undefined;
  const canCrop = true;
  const hasImage = Boolean(value) && !broken;
  // Only re-crop real remote images (uploaded / pasted https URLs).
  const canEditExisting = canCrop && hasImage && /^https?:\/\//.test(value);

  function save(url: string) {
    start(async () => {
      const res = await saveSitePhoto(slot.settingKey, url);
      if (!res.ok) {
        toastError(res.error);
        return;
      }
      success(`${slot.label} updated.`);
      router.refresh();
    });
  }

  async function uploadFile(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toastError(json.error || "Upload failed.");
        return;
      }
      setValue(json.url);
      setBroken(false);
      save(json.url);
      if (json.warning) toastError(json.warning);
    } catch {
      toastError("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function onPickFile(file: File) {
    if (canCrop) {
      // Crop the freshly-picked file before uploading (local blob = no CORS).
      setCropSrc(URL.createObjectURL(file));
    } else {
      uploadFile(file);
    }
  }

  function editExisting() {
    // Load the stored image through the same-origin proxy so the crop can save.
    setCropSrc(`/api/admin/image-proxy?url=${encodeURIComponent(value)}`);
  }

  function closeCropper() {
    if (cropSrc?.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  async function onCropped(file: File) {
    closeCropper();
    await uploadFile(file);
  }

  function reset() {
    setValue(slot.defaultSrc);
    setBroken(false);
    save("");
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-ink">{slot.label}</p>
        {usingDefault ? (
          <Badge tone="neutral">No image</Badge>
        ) : (
          <button
            onClick={reset}
            disabled={pending}
            className="shrink-0 text-xs font-medium text-clay hover:text-clay-dark"
          >
            Reset
          </button>
        )}
      </div>

      {/* Preview */}
      <div
        className={`mt-3 overflow-hidden rounded-lg bg-surface ring-1 ring-line ${slot.aspect}`}
      >
        {value && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={slot.alt}
            className={`h-full w-full ${slot.contain ? "object-contain p-3" : "object-cover"}`}
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs leading-relaxed text-ink-faint">
            No photo yet — {slot.alt}
          </div>
        )}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-ink-faint">{slot.hint}</p>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {canUpload && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || pending}
            >
              {uploading ? "Uploading…" : hasImage ? "Replace" : "Upload"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickFile(f);
                e.target.value = "";
              }}
            />
          </>
        )}
        {canEditExisting && (
          <Button
            variant="secondary"
            size="sm"
            onClick={editExisting}
            disabled={uploading || pending}
          >
            Crop &amp; position
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowUrl((v) => !v)}
          disabled={uploading}
        >
          {showUrl ? "Hide URL" : "Paste URL"}
        </Button>
      </div>

      {showUrl && (
        <div className="mt-2 flex items-center gap-2">
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setBroken(false);
            }}
            placeholder="https://…"
            className="min-w-0 flex-1"
          />
          <Button
            size="sm"
            onClick={() => save(value === slot.defaultSrc ? "" : value)}
            disabled={pending || uploading}
          >
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      )}

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          aspect={ratio}
          aspectOptions={aspectOptions}
          transparent={isLogo}
          filename={slot.key}
          title={`Crop & position — ${slot.label}`}
          onCancel={closeCropper}
          onCropped={onCropped}
        />
      )}
    </Card>
  );
}
