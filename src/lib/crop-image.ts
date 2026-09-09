/**
 * Client-side crop helpers for the admin photo editor. Given a source image and
 * the crop rectangle (in image pixels) from react-easy-crop, draw it to a canvas
 * and export a JPEG File ready to upload. No re-encoding on the server; the crop
 * is baked into the uploaded image so object-cover shows exactly what was chosen.
 */

export type CropPixels = { x: number; y: number; width: number; height: number };

/** Light, non-destructive adjustments applied when the crop is baked. 1 = no change. */
export type ImageAdjust = { brightness: number; contrast: number; saturate: number };

export const NO_ADJUST: ImageAdjust = { brightness: 1, contrast: 1, saturate: 1 };

function radians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Bounding box of an image rotated by `deg`. */
function rotatedSize(w: number, h: number, deg: number): { width: number; height: number } {
  const r = radians(deg);
  return {
    width: Math.abs(Math.cos(r) * w) + Math.abs(Math.sin(r) * h),
    height: Math.abs(Math.sin(r) * w) + Math.abs(Math.cos(r) * h),
  };
}

function filterString(a?: ImageAdjust): string {
  if (!a) return "none";
  const parts: string[] = [];
  if (a.brightness !== 1) parts.push(`brightness(${a.brightness})`);
  if (a.contrast !== 1) parts.push(`contrast(${a.contrast})`);
  if (a.saturate !== 1) parts.push(`saturate(${a.saturate})`);
  return parts.length ? parts.join(" ") : "none";
}

/** Turn a Tailwind aspect class ("aspect-[4/3]", "aspect-square") into a ratio. */
export function aspectRatioFromClass(aspect: string): number {
  if (aspect.includes("square")) return 1;
  const m = aspect.match(/\[(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\]/);
  return m ? Number(m[1]) / Number(m[2]) : 1;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Same-origin (blob: URLs and the /api/admin/image-proxy) keeps the canvas
    // clean so toBlob() works.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the image to crop."));
    img.src = src;
  });
}

/**
 * Export the chosen crop as a File, downscaling very large crops.
 *
 * `format` defaults to "jpeg" (photos). Pass "png" for logos and other images
 * with transparency: the canvas starts fully transparent and PNG preserves the
 * alpha channel, so a transparent-background logo stays transparent (a JPEG
 * would flatten it onto black). The crop rectangle can extend past the image
 * edges (react-easy-crop allows this when the image is zoomed out to fit); the
 * area outside the image simply stays transparent.
 */
export async function getCroppedFile(
  src: string,
  crop: CropPixels,
  filename = "crop",
  opts: {
    maxWidth?: number;
    format?: "jpeg" | "png";
    /** Rotation in degrees (matches the value passed to react-easy-crop). */
    rotation?: number;
    /** Light adjustments baked into the export. */
    adjust?: ImageAdjust;
  } = {}
): Promise<File> {
  const { maxWidth = 2000, format = "jpeg", rotation = 0, adjust } = opts;
  const image = await loadImage(src);

  // Stage 1: draw the whole image, rotated and adjusted, onto a bounding-box
  // canvas. react-easy-crop's crop pixels are relative to this rotated box.
  const bbox = rotatedSize(image.width, image.height, rotation);
  const stage = document.createElement("canvas");
  stage.width = Math.max(1, Math.round(bbox.width));
  stage.height = Math.max(1, Math.round(bbox.height));
  const sctx = stage.getContext("2d");
  if (!sctx) throw new Error("Your browser could not process the image.");
  sctx.imageSmoothingQuality = "high";
  sctx.filter = filterString(adjust);
  sctx.translate(stage.width / 2, stage.height / 2);
  sctx.rotate(radians(rotation));
  sctx.drawImage(image, -image.width / 2, -image.height / 2);

  // Stage 2: pull out the crop rectangle, downscaling very large crops.
  let outW = crop.width;
  let outH = crop.height;
  if (outW > maxWidth) {
    const scale = maxWidth / outW;
    outW = Math.round(outW * scale);
    outH = Math.round(outH * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(outW));
  canvas.height = Math.max(1, Math.round(outH));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process the image.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    stage,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const mime = format === "png" ? "image/png" : "image/jpeg";
  const ext = format === "png" ? "png" : "jpg";
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not export the crop."))),
      mime,
      format === "png" ? undefined : 0.92
    )
  );

  return new File([blob], `${filename}.${ext}`, { type: mime });
}
