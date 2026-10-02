import sharp from "sharp";

/**
 * Shrink an upload before it is stored.
 *
 * Display size on the site is well under 2000px on the long edge (blog column
 * is about 632px, gallery cells smaller). Multi-megabyte phone photos and
 * uncompressed PNGs are resized and re-encoded here. GIFs stay untouched so
 * animation is preserved. A PNG with real transparency stays a PNG. A large
 * PNG whose alpha is fully opaque (screenshots, generated heroes) is stored
 * as JPEG. Small logos and badges stay PNG.
 *
 * If the result is not smaller, the original bytes are returned.
 */

const MAX_EDGE = 2000;
const JPEG_QUALITY = 82;

export type PreparedImage = {
  bytes: Buffer;
  contentType: string;
};

export async function compressForWeb(
  bytes: Buffer,
  contentType: string
): Promise<PreparedImage> {
  const type = (contentType || "").toLowerCase().split(";")[0].trim();
  if (
    !type.startsWith("image/") ||
    type === "image/gif" ||
    type === "image/svg+xml"
  ) {
    return { bytes, contentType: type || contentType };
  }

  try {
    const meta = await sharp(bytes, { failOn: "none" }).metadata();
    if ((meta.pages ?? 1) > 1) {
      return { bytes, contentType: type };
    }

    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    const stats = await sharp(bytes, { failOn: "none" }).stats();
    const alpha = meta.hasAlpha ? stats.channels[stats.channels.length - 1] : undefined;
    const fullyOpaque = !meta.hasAlpha || (alpha != null && alpha.min === 255);

    let pipeline = sharp(bytes, { failOn: "none" }).rotate();
    if (width > MAX_EDGE || height > MAX_EDGE) {
      pipeline = pipeline.resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Only heavy opaque PNGs become JPEG (phone screenshots, generated
    // heroes). A small logo or badge stays PNG.
    const largeOpaquePng =
      type === "image/png" && fullyOpaque && bytes.length > 250_000;

    let out: Buffer;
    let outType = type;
    if (type === "image/jpeg" || type === "image/jpg" || largeOpaquePng) {
      out = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
      outType = "image/jpeg";
    } else if (type === "image/webp") {
      out = await pipeline.webp({ quality: JPEG_QUALITY }).toBuffer();
      outType = "image/webp";
    } else if (type === "image/png") {
      out = await pipeline.png({ compressionLevel: 9 }).toBuffer();
      outType = "image/png";
    } else if (type === "image/avif") {
      out = await pipeline.avif({ quality: 50 }).toBuffer();
      outType = "image/avif";
    } else {
      return { bytes, contentType: type };
    }

    if (out.length >= bytes.length) {
      return { bytes, contentType: type };
    }
    return { bytes: out, contentType: outType };
  } catch {
    return { bytes, contentType: type || contentType };
  }
}
