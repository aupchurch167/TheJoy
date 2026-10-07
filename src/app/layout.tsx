import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { BUSINESS, OG_IMAGE, SITE_URL } from "@/lib/site";
import Analytics from "@/components/Analytics";

// Public Cloudflare R2 bucket that holds uploaded photos and logos.
const R2_ORIGIN = "https://pub-6e43e90472054fe3880f53e8c0ca3b60.r2.dev";

export const viewport: Viewport = {
  themeColor: "#f8f8f9",
};

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// The title `template` appends the brand to child-page titles, so page
// metadata must NOT include the brand itself (or it double-brands). Pages that
// want the brand first (the homepage) set `title: { absolute: "..." }`.
const DEFAULT_TITLE = `${BUSINESS.name} | Senior Living & Memory Care in Loganville, GA`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${BUSINESS.name}`,
  },
  description: BUSINESS.descriptor,
  applicationName: BUSINESS.name,
  authors: [{ name: BUSINESS.name }],
  robots: { index: true, follow: true },
  // Default social card. The 1200x630 image is generated at /og and shared via
  // OG_IMAGE. Pages that set their own `openGraph` overwrite this whole object,
  // so each includes OG_IMAGE too.
  //
  // twitter:title and twitter:description are intentionally unset here. Next
  // fills a missing twitter title/description from the page's own openGraph or
  // title/description, but an explicit value on this layout is inherited by
  // every page and blocks that. Pages call pageTwitter() so the tags match
  // that page. This object only keeps the card type and the shared image for
  // any route that does not set twitter itself.
  openGraph: {
    type: "website",
    siteName: BUSINESS.name,
    locale: "en_US",
    url: SITE_URL,
    title: DEFAULT_TITLE,
    description: BUSINESS.descriptor,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        {/* Open the connection to the R2 photo bucket early. dns-prefetch is
            the fallback for browsers without preconnect. */}
        <link rel="preconnect" href={R2_ORIGIN} />
        <link rel="dns-prefetch" href={R2_ORIGIN} />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
