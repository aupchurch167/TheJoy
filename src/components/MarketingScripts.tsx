import Script from "next/script";
import { getSettings } from "@/lib/settings";

/**
 * Third-party marketing scripts for the PUBLIC site only (mounted in the
 * (site) layout, never in /admin, so the CMS stays clean and Further's chat
 * bubble doesn't show while editing).
 *
 * 1. Google Tag Manager (container GTM-KB6N9GQL) — carried over from the old
 *    Webflow site so existing tags/analytics keep firing.
 * 2. TalkFurther loader — injects js.talkfurther.com/talkfurther_init.min.js,
 *    which binds to this domain and powers the in-page tour flow. It ONLY loads
 *    when the admin toggle "Use the TalkFurther scheduler for Book a tour"
 *    (tour_use_talkfurther) is on. Turn that off and the Further widget/bubble
 *    does not load at all (the Book-a-tour buttons then go to the on-site /tour
 *    page instead), which also stops the widget's auto-engage/call on load.
 *
 * (The old site's `.w-webflow-badge { display:none }` rule is intentionally
 * omitted: there is no Webflow badge on this site, so the rule is dead.)
 */

// The GTM container is inherited from the old Webflow site. It can be turned
// off without a code change by setting NEXT_PUBLIC_GTM_ID to an empty string in
// the environment (leave it unset to keep the original container). This matters
// because legacy tags inside that container (e.g. call tracking) can trigger a
// tel: action on load, which iOS blocks with a "started a call" prompt.
const GTM_ID =
  process.env.NEXT_PUBLIC_GTM_ID !== undefined
    ? process.env.NEXT_PUBLIC_GTM_ID
    : "GTM-KB6N9GQL";

export default async function MarketingScripts() {
  const settings = await getSettings();
  const talkFurtherEnabled = settings.tour_use_talkfurther === "on";

  return (
    <>
      {GTM_ID && (
        <>
          {/* Google Tag Manager (head bootstrap) */}
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>

          {/* Google Tag Manager (noscript fallback) */}
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      )}

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
