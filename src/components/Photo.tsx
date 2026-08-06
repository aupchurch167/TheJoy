"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Photo shows a real image. Joy uses NO stock photos. Until Adam adds the real
 * file, this renders a calm labeled placeholder (the image alt text) instead of
 * a broken image, so the page always looks intentional.
 *
 * Optimization: images on hosts we control (local /public, Cloudflare R2, and
 * the legacy Webflow CDN while posts are being migrated) go through next/image,
 * which resizes them and serves AVIF/WebP (the single biggest Core Web Vitals
 * win here, since uploaded shots can be multi-megabyte). Any OTHER host falls
 * back to a plain <img>: next/image throws on hostnames not in the config
 * allowlist, so this keeps an unexpected URL from ever crashing a page. The
 * allowlist below must stay a subset of images.remotePatterns in next.config.
 */

const OPTIMIZABLE_HOST = [/(^|\.)r2\.dev$/i, /(^|\.)website-files\.com$/i];

function canOptimize(src: string): boolean {
  if (!src) return false;
  // Local /public path (but not a protocol-relative //host URL).
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const { hostname } = new URL(src);
    if (hostname === "uploads-ssl.webflow.com") return true;
    return OPTIMIZABLE_HOST.some((re) => re.test(hostname));
  } catch {
    return false;
  }
}

export default function Photo({
  src,
  alt,
  className = "",
  rounded = "rounded-2xl",
  priority = false,
  // Rendered width across breakpoints, so next/image can pick the right size.
  // Default assumes a half-width block on desktop, full-width on mobile.
  sizes = "(max-width: 1024px) 100vw, 50vw",
}: {
  src: string;
  alt: string;
  className?: string;
  rounded?: string;
  priority?: boolean;
  sizes?: string;
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

  if (canOptimize(src)) {
    return (
      <div className={`relative overflow-hidden ${rounded} ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
          className="object-cover"
        />
      </div>
    );
  }

  // Unknown remote host: plain <img> (unoptimized, but never crashes the page).
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
