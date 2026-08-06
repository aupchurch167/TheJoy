/**
 * Client-side crop helpers for the admin photo editor. Given a source image and
 * the crop rectangle (in image pixels) from react-easy-crop, draw it to a canvas
 * and export a JPEG File ready to upload. No re-encoding on the server; the crop
 * is baked into the uploaded image so object-cover shows exactly what was chosen.
 */

export type CropPixels = { x: number; y: number; width: number; height: number };

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
  opts: { maxWidth?: number; format?: "jpeg" | "png" } = {}
): Promise<File> {
  const { maxWidth = 2000, format = "jpeg" } = opts;
  const image = await loadImage(src);

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
    image,
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
