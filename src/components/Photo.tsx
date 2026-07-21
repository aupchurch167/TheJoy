"use client";

import { useState } from "react";

/**
 * Photo shows a real image from /public/images. Joy uses NO stock photos.
 * Until Adam adds the real file, this renders a calm labeled placeholder
 * (the image alt text) instead of a broken image, so the page always looks
 * intentional. Drop the real .jpg at the given path and it appears.
 *
 * See OPERATIONS.md for the full list of photos to add and their filenames.
 */
export default function Photo({
  src,
  alt,
  className = "",
  rounded = "rounded-2xl",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  rounded?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
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

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-cover ${rounded} ${className}`}
    />
  );
}
