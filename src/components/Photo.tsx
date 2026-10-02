"use client";

import { useState } from "react";
import Image, { getImageProps } from "next/image";
import { canOptimize } from "@/lib/optimizable-image";

/**
 * Photo shows a real image. Joy uses NO stock photos. Until Adam adds the real
 * file, this renders a calm labeled placeholder (the image alt text) instead of
 * a broken image, so the page always looks intentional.
 *
 * Optimization: images on hosts we control (local /public, Cloudflare R2, and
 * the legacy Webflow CDN while posts are being migrated) go through next/image,
 * which resizes them and serves AVIF/WebP. Any OTHER host falls back to a plain
 * img: next/image throws on hostnames not in the config allowlist, so this
 * keeps an unexpected URL from ever crashing a page. The host check lives in
 * src/lib/optimizable-image.ts and must stay a subset of images.remotePatterns.
 *
 * fit="cover" (the default) fills a sized frame and crops. fit="intrinsic"
 * is for prose photos: the picture keeps its real aspect ratio and is capped
 * at the column width. Width and height are not written onto that img, because
 * next/image would lock the aspect ratio to whatever pixel size we guessed.
 */

export default function Photo({
  src,
  alt,
  title,
  className = "",
  rounded = "rounded-2xl",
  priority = false,
  // Rendered width across breakpoints, so next/image can pick the right size.
  // Default assumes a half-width block on desktop, full-width on mobile.
  sizes = "(max-width: 1024px) 100vw, 50vw",
  fit = "cover",
}: {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  rounded?: string;
  priority?: boolean;
  sizes?: string;
  fit?: "cover" | "intrinsic";
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-line/60 text-ink-faint ${rounded} ${className}`}
      >
        <span className="max-w-xs px-6 py-8 text-center text-sm leading-relaxed">
          Add real photo: {alt}
        </span>
      </div>
    );
  }

  if (fit === "intrinsic") {
    const imgClass = `h-auto max-w-full ${rounded} ${className}`;
    if (!canOptimize(src)) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          title={title}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className={imgClass}
        />
      );
    }

    // width/height are required by getImageProps and are not copied onto the
    // img. The browser then uses the file's own aspect ratio.
    const { props } = getImageProps({
      src,
      alt,
      title,
      width: 1600,
      height: 1067,
      sizes,
      priority,
    });

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={alt}
        title={title}
        loading={props.loading}
        decoding="async"
        sizes={props.sizes}
        srcSet={props.srcSet}
        src={props.src}
        onError={() => setFailed(true)}
        className={imgClass}
      />
    );
  }

  if (canOptimize(src)) {
    return (
      <div className={`relative overflow-hidden ${rounded} ${className}`}>
        <Image
          src={src}
          alt={alt}
          title={title}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
          className="object-cover"
        />
      </div>
    );
  }

  // Unknown remote host: plain img (unoptimized, but never crashes the page).
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      title={title}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-cover ${rounded} ${className}`}
    />
  );
}
