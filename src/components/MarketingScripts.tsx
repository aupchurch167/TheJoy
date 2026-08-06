import Script from "next/script";

/**
 * Third-party marketing scripts for the PUBLIC site only (mounted in the
 * (site) layout, never in /admin, so the CMS stays clean and Further's chat
 * bubble doesn't show while editing).
 *
 * 1. Google Tag Manager (container GTM-KB6N9GQL) — carried over from the old
 *    Webflow site so existing tags/analytics keep firing.
 * 2. TalkFurther loader — injects js.talkfurther.com/talkfurther_init.min.js,
 *    which binds to this domain and powers the in-page tour flow. Once loaded,
 *    a "Book a tour" link to /#/further/55 (or window.FurtherEmbeddedVSA.open(55))
 *    opens the "Schedule A Tour" scheduler, same as joyseniorcare.com today.
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

export default function MarketingScripts() {
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

      {/* TalkFurther loader (binds to this domain, powers the in-page tour) */}
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
    </>
  );
}
