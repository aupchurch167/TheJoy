import Script from "next/script";
import { getSettings } from "@/lib/settings";

/**
 * Third-party marketing scripts for the PUBLIC site only (mounted in the
 * (site) layout, never in /admin, so the CMS stays clean and Further's chat
 * bubble doesn't show while editing).
 *
 * TalkFurther loader: injects js.talkfurther.com/talkfurther_init.min.js,
 * which binds to this domain and powers the in-page tour flow. It ONLY loads
 * when the admin toggle "Use the TalkFurther scheduler for Book a tour"
 * (tour_use_talkfurther) is on. Turn that off and the Further widget/bubble
 * does not load at all (the Book-a-tour buttons then go to the on-site /tour
 * page instead), which also stops the widget's auto-engage/call on load.
 *
 * The old Webflow site's Google Tag Manager container (GTM-KB6N9GQL) was
 * removed for page speed. Analytics are Plausible (Analytics.tsx), which loads
 * when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set.
 *
 * (The old site's `.w-webflow-badge { display:none }` rule is intentionally
 * omitted: there is no Webflow badge on this site, so the rule is dead.)
 */

export default async function MarketingScripts() {
  const settings = await getSettings();
  const talkFurtherEnabled = settings.tour_use_talkfurther === "on";

  return (
    <>
      {/* TalkFurther loader — only when the admin toggle enables the scheduler. */}
      {talkFurtherEnabled && (
        <Script id="talkfurther-init" strategy="afterInteractive">
          {`(function () {
var a = document.createElement("script");
var b = document.getElementsByTagName("script")[0];
a.type = "text/javascript";
a.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + "js.talkfurther.com/talkfurther_init.min.js";
a.async = true;
b.parentNode.insertBefore(a, b);
})();`}
        </Script>
      )}

      {/* Book-a-tour bridge. The Further widget no longer reacts to the
          #/further/55 hash (the URL changes but the scheduler never opens), so
          same-site #/further/ links call its openTour() API instead. Landing
          on a #/further/ URL (email and drip links, new tabs) opens it too.
          If the widget never loads (blocked or down), clicks go to /tour. */}
      {talkFurtherEnabled && (
        <Script id="talkfurther-tour-links" strategy="afterInteractive">
          {`(function () {
function isTourHash(h) { return /^#\\/further\\//.test(h || ""); }
function openTour() {
  try {
    if (window.FurtherEmbeddedVSA && window.FurtherEmbeddedVSA.openTour) { window.FurtherEmbeddedVSA.openTour(); return true; }
    if (window.FurtherChat && window.FurtherChat.openTour) { window.FurtherChat.openTour(); return true; }
  } catch (e) {}
  return false;
}
document.addEventListener("click", function (e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  var a = e.target && e.target.closest && e.target.closest("a[href]");
  if (!a) return;
  var url;
  try { url = new URL(a.href, location.href); } catch (err) { return; }
  if (url.hostname.replace(/^www\\./, "") !== location.hostname.replace(/^www\\./, "")) return;
  if (!isTourHash(url.hash)) return;
  e.preventDefault();
  if (!openTour() && location.pathname !== "/tour") location.href = "/tour";
}, true);
if (isTourHash(location.hash)) {
  var tries = 0;
  var timer = setInterval(function () {
    if (openTour() || ++tries > 40) clearInterval(timer);
  }, 500);
}
})();`}
        </Script>
      )}
    </>
  );
}
