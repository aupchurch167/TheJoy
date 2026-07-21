"use client";

import Script from "next/script";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * Privacy-friendly analytics via Plausible (no cookies, GDPR-friendly, a good
 * fit for a senior-care audience). Only loads when NEXT_PUBLIC_PLAUSIBLE_DOMAIN
 * is set; otherwise renders nothing.
 *
 * Also records the site's key conversion: a "Tour click" whenever anyone
 * clicks the single TalkFurther tour button (marked data-tour-cta). Lead form
 * submissions fire "Lead form submit" from the form itself.
 */
export default function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const src =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ||
    "https://plausible.io/js/script.tagged-events.js";

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-tour-cta]")) {
        track("Tour click");
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!domain) return null;

  return (
    <Script
      defer
      data-domain={domain}
      src={src}
      strategy="afterInteractive"
    />
  );
}
