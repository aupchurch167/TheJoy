"use client";

/**
 * Fire a conversion event to Plausible (if configured). No-ops when analytics
 * is not set up. Kept provider-thin on purpose.
 */
declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
  }
}

export function track(event: string, props?: Record<string, string>): void {
  if (typeof window !== "undefined" && typeof window.plausible === "function") {
    window.plausible(event, props ? { props } : undefined);
  }
}
