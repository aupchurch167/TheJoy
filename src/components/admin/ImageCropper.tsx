"use client";

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedFile, type CropPixels } from "@/lib/crop-image";
import { Button } from "@/components/admin/ui";

export type AspectOption = { label: string; value: number };

/**
 * A modal to crop, pan, and zoom an image to a target aspect ratio, then export
 * the result as a File. Used from the Site Photos and Gallery admin screens so
 * an operator can frame a photo without any outside tool.
 *
 * `src` must be same-origin-loadable (a blob: URL for a freshly picked file, or
 * /api/admin/image-proxy for an already-uploaded image) so the canvas can export.
 *
 * Logo mode (`transparent`): exports PNG so a transparent background survives,
 * lets the operator zoom OUT below 1x so the whole wordmark fits inside the
 * frame with padding, and shows a checkerboard behind the image so transparency
 * is visible. `aspectOptions` lets them pick the crop shape (e.g. wide vs square).
 */
export default function ImageCropper({
  src,
  aspect,
  aspectOptions,
  transparent = false,
  filename = "crop",
  title = "Crop & position",
  onCancel,
  onCropped,
}: {
  src: string;
  aspect: number;
  aspectOptions?: AspectOption[];
  transparent?: boolean;
  filename?: string;
  title?: string;
  onCancel: () => void;
  onCropped: (file: File) => Promise<void> | void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [ratio, setRatio] = useState(aspect);
  const [pixels, setPixels] = useState<CropPixels | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Logos need to fit whole (zoom out) and keep transparent padding.
  const minZoom = transparent ? 0.3 : 1;

  const onCropComplete = useCallback((_area: unknown, areaPixels: CropPixels) => {
    setPixels(areaPixels);
  }, []);

  async function save() {
    if (!pixels) return;
    setBusy(true);
    setError("");
    try {
      const file = await getCroppedFile(src, pixels, filename, {
        format: transparent ? "png" : "jpeg",
      });
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

        {aspectOptions && aspectOptions.length > 1 && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-ink-faint">Shape</span>
            {aspectOptions.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setRatio(opt.value)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors ${
                  ratio === opt.value
                    ? "bg-clay text-white ring-clay"
                    : "bg-white text-ink-soft ring-line hover:bg-surface"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div
          className={`relative h-[58vh] max-h-[26rem] w-full overflow-hidden rounded-xl ${
            transparent ? "" : "bg-ink/5"
          }`}
          // Checkerboard behind the image so transparency is visible for logos.
          style={
            transparent
              ? {
                  backgroundColor: "#fff",
                  backgroundImage:
                    "linear-gradient(45deg, #e2e5e9 25%, transparent 25%), linear-gradient(-45deg, #e2e5e9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e5e9 75%), linear-gradient(-45deg, transparent 75%, #e2e5e9 75%)",
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                }
              : undefined
          }
        >
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            minZoom={minZoom}
            aspect={ratio}
            restrictPosition={!transparent}
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
            min={minZoom}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-clay"
            aria-label="Zoom"
          />
        </div>

        <p className="mt-3 text-xs text-ink-faint">
          {transparent
            ? "Drag to reposition and zoom out to fit the whole logo. Transparent areas stay transparent."
            : "Drag to reposition, scroll or use the slider to zoom. The crop matches where this photo appears on the site."}
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
