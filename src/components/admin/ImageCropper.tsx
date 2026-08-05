"use client";

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedFile, type CropPixels } from "@/lib/crop-image";
import { Button } from "@/components/admin/ui";

/**
 * A modal to crop, pan, and zoom an image to a target aspect ratio, then export
 * the result as a JPEG File. Used from the Site Photos and Gallery admin screens
 * so an operator can frame a photo without any outside tool.
 *
 * `src` must be same-origin-loadable (a blob: URL for a freshly picked file, or
 * /api/admin/image-proxy for an already-uploaded image) so the canvas can export.
 */
export default function ImageCropper({
  src,
  aspect,
  filename = "crop",
  title = "Crop & position",
  onCancel,
  onCropped,
}: {
  src: string;
  aspect: number;
  filename?: string;
  title?: string;
  onCancel: () => void;
  onCropped: (file: File) => Promise<void> | void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<CropPixels | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_area: unknown, areaPixels: CropPixels) => {
    setPixels(areaPixels);
  }, []);

  async function save() {
    if (!pixels) return;
    setBusy(true);
    setError("");
    try {
      const file = await getCroppedFile(src, pixels, filename);
      await onCropped(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the crop.");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
        <p className="mb-3 text-sm font-semibold text-ink">{title}</p>

        <div className="relative h-[58vh] max-h-[26rem] w-full overflow-hidden rounded-xl bg-ink/5">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
            zoomWithScroll
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs font-medium text-ink-faint">Zoom</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-clay"
            aria-label="Zoom"
          />
        </div>

        <p className="mt-3 text-xs text-ink-faint">
          Drag to reposition, scroll or use the slider to zoom. The crop matches
          where this photo appears on the site.
        </p>

        {error && (
          <p className="mt-2 text-sm font-medium text-danger" role="alert">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={busy || !pixels}>
            {busy ? "Saving…" : "Save crop"}
          </Button>
        </div>
      </div>
    </div>
  );
}
