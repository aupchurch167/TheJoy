import { ImageResponse } from "next/og";
import { BUSINESS, BUSINESS_ADDRESS_ONE_LINE } from "@/lib/site";

/**
 * Generated default social card (1200x630), served at /og. Referenced
 * explicitly by OG_IMAGE in lib/site.ts (a plain route handler, not the
 * opengraph-image file convention, because pages that set their own
 * `openGraph` overwrite the parent's image entirely, so a single shared URL
 * we reference from each page is the predictable way to get one og:image).
 *
 * Kept to solid colors and the built-in font so it never needs a network
 * fetch or a bundled font. §2/§4: plain wording, "personal care home" named,
 * "assisted living" never claimed. satori requires display:flex on any node
 * with more than one child, so each text line is a single precomputed string.
 */
export const runtime = "nodejs";

const PAPER = "#f8f8f9";
const INK = "#071417";
const CLAY = "#01a7ce";

const SUBTITLE = `Senior living and memory care in ${BUSINESS.address.city}, ${BUSINESS.address.state}. Small enough to know your parent by name.`;

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          padding: "80px",
          borderTop: `24px solid ${CLAY}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 34,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: CLAY,
              fontWeight: 700,
            }}
          >
            Personal Care Home
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 92,
              lineHeight: 1.05,
              color: INK,
              fontWeight: 700,
            }}
          >
            {BUSINESS.name}
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 40,
              lineHeight: 1.25,
              color: "#3a4a4e",
              maxWidth: 900,
            }}
          >
            {SUBTITLE}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 36, color: INK, fontWeight: 700 }}>
            {BUSINESS.phone}
          </div>
          <div style={{ fontSize: 30, color: "#5c6b6f" }}>
            {BUSINESS_ADDRESS_ONE_LINE}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
