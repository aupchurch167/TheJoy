import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/site";

/**
 * Android Add to Home Screen reads this manifest. The PNGs are the Joy mark
 * (same artwork as app/apple-icon.png) on a solid field the color of the
 * mark's ring, so the corners stay filled when the launcher masks the icon.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BUSINESS.name,
    short_name: "Joy",
    description: BUSINESS.descriptor,
    start_url: "/",
    display: "standalone",
    background_color: "#f8f8f9",
    theme_color: "#f8f8f9",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
