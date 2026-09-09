"use client";

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import {
  getCroppedFile,
  type CropPixels,
  type ImageAdjust,
  NO_ADJUST,
} from "@/lib/crop-image";
import { Button } from "@/components/admin/ui";

export type AspectOption = { label: string; value: number };

/**
 * A modal to crop, pan, zoom, ROTATE, and lightly adjust an image (brightness,
 * contrast, saturation), then export the result as a File. Used anywhere an
 * operator adds a photo (Site Photos, Gallery, blog hero, email photos).
 *
 * `src` must be same-origin-loadable (a blob: URL for a freshly picked file, or
 * /api/admin/image-proxy for an already-uploaded image) so the canvas can export.
 *
 * Logo mode (`transparent`): exports PNG so a transparent background survives,
 * lets the operator zoom OUT below 1x so the whole wordmark fits, and shows a
 * checkerboard behind the image. `aspectOptions` picks the crop shape; `allowFree`
 * adds an "Original" shape (the photo's own proportions, i.e. no cropping).
 */
export default function ImageCropper({
  src,
  aspect,
  aspectOptions,
  allowFree = false,
  allowRotate = true,
  allowAdjust = true,
  transparent = false,
  filename = "photo",
  title = "Edit photo",
  onCancel,
  onCropped,
}: {
  src: string;
  aspect: number;
  aspectOptions?: AspectOption[];
  allowFree?: boolean;
  allowRotate?: boolean;
  allowAdjust?: boolean;
  transparent?: boolean;
  filename?: string;
  title?: string;
  onCancel: () => void;
  onCropped: (file: File) => Promise<void> | void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [ratio, setRatio] = useState(aspect);
  const [ratioTouched, setRatioTouched] = useState(false);
  const [naturalAspect, setNaturalAspect] = useState<number | null>(null);
  const [adjust, setAdjust] = useState<ImageAdjust>(NO_ADJUST);
  const [pixels, setPixels] = useState<CropPixels | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Logos need to fit whole (zoom out) and keep transparent padding.
  const minZoom = transparent ? 0.3 : 1;

  const onCropComplete = useCallback((_area: unknown, areaPixels: CropPixels) => {
    setPixels(areaPixels);
  }, []);

  // Capture the photo's own proportions so "Original" can offer no-crop.
  const onMediaLoaded = useCallback(
    (media: { naturalWidth: number; naturalHeight: number }) => {
      const nat = media.naturalWidth / media.naturalHeight;
      setNaturalAspect(nat);
      if (allowFree && !ratioTouched) setRatio(nat); // default to no-crop
    },
    [allowFree, ratioTouched]
  );

  const filterCss = [
    adjust.brightness !== 1 ? `brightness(${adjust.brightness})` : "",
    adjust.contrast !== 1 ? `contrast(${adjust.contrast})` : "",
    adjust.saturate !== 1 ? `saturate(${adjust.saturate})` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const shapeOptions: AspectOption[] = [
    ...(allowFree && naturalAspect
      ? [{ label: "Original", value: naturalAspect }]
      : []),
    ...(aspectOptions ?? []),
  ];

  function pickRatio(v: number) {
    setRatioTouched(true);
    setRatio(v);
  }

  async function save() {
    if (!pixels) return;
    setBusy(true);
    setError("");
    try {
      const file = await getCroppedFile(src, pixels, filename, {
        format: transparent ? "png" : "jpeg",
        rotation,
        adjust,
      });
      await onCropped(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the photo.");
      setBusy(false);
    }
  }

  const dirty =
    rotation !== 0 ||
    adjust.brightness !== 1 ||
    adjust.contrast !== 1 ||
    adjust.saturate !== 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">{title}</p>
          {dirty && (
            <button
              type="button"
              onClick={() => {
                setRotation(0);
                setAdjust(NO_ADJUST);
              }}
              className="text-xs font-semibold text-ink-faint hover:text-ink"
            >
              Reset edits
            </button>
          )}
        </div>

        {shapeOptions.length > 1 && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-ink-faint">Shape</span>
            {shapeOptions.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => pickRatio(opt.value)}
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
          className={`relative h-[52vh] max-h-[24rem] w-full overflow-hidden rounded-xl ${
            transparent ? "" : "bg-ink/5"
          }`}
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
            rotation={rotation}
            minZoom={minZoom}
            aspect={ratio}
            restrictPosition={!transparent}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            onMediaLoaded={onMediaLoaded}
            style={filterCss ? { mediaStyle: { filter: filterCss } } : undefined}
            showGrid
            zoomWithScroll
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="w-14 text-xs font-medium text-ink-faint">Zoom</span>
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

        {allowRotate && (
          <div className="mt-2 flex items-center gap-3">
            <span className="w-14 text-xs font-medium text-ink-faint">Rotate</span>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="flex-1 accent-clay"
              aria-label="Rotate"
            />
            <button
              type="button"
              onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
              className="rounded-md px-2 py-1 text-sm text-ink-soft hover:bg-surface"
              aria-label="Rotate left 90 degrees"
            >
              ↺
            </button>
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="rounded-md px-2 py-1 text-sm text-ink-soft hover:bg-surface"
              aria-label="Rotate right 90 degrees"
            >
              ↻
            </button>
          </div>
        )}

        {allowAdjust && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(
              [
                ["Brightness", "brightness"],
                ["Contrast", "contrast"],
                ["Saturation", "saturate"],
              ] as const
            ).map(([label, key]) => (
              <label key={key} className="flex items-center gap-2">
                <span className="w-16 text-[11px] font-medium text-ink-faint">
                  {label}
                </span>
                <input
                  type="range"
                  min={0.5}
                  max={1.5}
                  step={0.01}
                  value={adjust[key]}
                  onChange={(e) =>
                    setAdjust((a) => ({ ...a, [key]: Number(e.target.value) }))
                  }
                  className="flex-1 accent-clay"
                  aria-label={label}
                />
              </label>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-ink-faint">
          {transparent
            ? "Drag to reposition and zoom out to fit the whole logo. Transparent areas stay transparent."
            : "Drag to reposition; scroll or use the slider to zoom. Rotate and adjust light with the sliders."}
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
            {busy ? "Saving…" : "Save photo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
