import Image from "next/image";
import { canOptimize } from "@/lib/optimizable-image";

/**
 * An uploaded logo, sized by CSS height (h-9, h-10) with width auto.
 *
 * Uploads are full-size PNGs (the wordmark is 649x216), so these go through
 * next/image, which serves a WebP/AVIF at the rendered size instead. width and
 * height are the rendered box for a 3:1 wordmark or a square mark. They pick
 * the 1x/2x files and reserve space; the CSS `w-auto` still lets a logo with a
 * different shape show at its real aspect ratio. A host outside the next/image
 * allowlist falls back to a plain img.
 */
export default function BrandLogo({
  src,
  alt,
  width,
  height,
  className,
  eager = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className: string;
  // Header logos are above the fold, so they load eagerly. The footer's can wait.
  eager?: boolean;
}) {
  if (!canOptimize(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        className={className}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      className={className}
    />
  );
}
