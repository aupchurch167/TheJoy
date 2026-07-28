"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

/**
 * The visible promotion bar. Dismissible: once closed it stays hidden for that
 * exact message (stored in localStorage). Change the message in the admin and
 * it reappears for everyone, because the storage key is derived from the text.
 */
function storageKeyFor(text: string): string {
  // Small stable hash of the message, so a new promo is a new key.
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (Math.imul(h, 31) + text.charCodeAt(i)) | 0;
  }
  return `joy_promo_dismissed_${h >>> 0}`;
}

// Cross-tab sync: re-read when another tab dismisses the same promo.
function subscribe(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export default function PromoBannerClient({
  text,
  ctaLabel,
  ctaUrl,
}: {
  text: string;
  ctaLabel: string;
  ctaUrl: string;
}) {
  const storageKey = storageKeyFor(text);

  // Read the stored "dismissed" flag without a setState-in-effect. The server
  // snapshot is always "not dismissed", so the banner renders during SSR and
  // hydration, then hides on the client if it was dismissed before.
  const storedDismissed = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(storageKey) === "1";
      } catch {
        return false;
      }
    },
    () => false
  );

  // Local dismiss for an immediate hide in this tab.
  const [justDismissed, setJustDismissed] = useState(false);

  if (storedDismissed || justDismissed) return null;

  function dismiss() {
    setJustDismissed(true);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // ignore (private mode)
    }
  }

  const hasCta = ctaLabel !== "" && ctaUrl !== "";
  const isInternal = ctaUrl.startsWith("/");
  const ctaClass =
    "shrink-0 whitespace-nowrap font-semibold underline underline-offset-2 hover:text-white/80";

  return (
    <div className="relative bg-clay text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-10 py-2.5 text-center text-sm">
        <span>{text}</span>
        {hasCta &&
          (isInternal ? (
            <Link href={ctaUrl} className={ctaClass}>
              {ctaLabel}
            </Link>
          ) : (
            <a
              href={ctaUrl}
              className={ctaClass}
              {...(ctaUrl.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {ctaLabel}
            </a>
          ))}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-white/80 hover:bg-white/15 hover:text-white"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
