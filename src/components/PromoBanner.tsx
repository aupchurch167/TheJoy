import { getSettings } from "@/lib/settings";
import PromoBannerClient from "./PromoBannerClient";

/**
 * Site-wide promotion banner. A thin announcement bar at the very top of every
 * public page. Controlled entirely from the admin (Site settings > Promotion
 * banner): a toggle, the message, and an optional button. Renders nothing
 * unless the toggle is on and there is a message.
 */
export default async function PromoBanner() {
  const settings = await getSettings();

  const enabled = settings.promo_enabled === "on";
  const text = settings.promo_text.trim();
  if (!enabled || text === "") return null;

  // A button only shows when both its label and link are set.
  const ctaLabel = settings.promo_cta_label.trim();
  const ctaUrl = settings.promo_cta_url.trim();
  const showCta = ctaLabel !== "" && ctaUrl !== "";

  return (
    <PromoBannerClient
      text={text}
      ctaLabel={showCta ? ctaLabel : ""}
      ctaUrl={showCta ? ctaUrl : ""}
    />
  );
}
