import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MarketingScripts from "@/components/MarketingScripts";
import PromoBanner from "@/components/PromoBanner";

// Render dynamically so admin edits to site settings (contact facts, careers
// link, tour link) in the shared header/footer show up promptly.
export const dynamic = "force-dynamic";

// Layout for the public marketing site (home, blog, unsubscribe).
// Admin routes use their own layout with different chrome.
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingScripts />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-clay focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <PromoBanner />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
