import { AWARD, BUSINESS, SITE_URL } from "./site";

/**
 * schema.org structured data for local SEO. Uses SeniorCare + LocalBusiness.
 * The NAP (name, address, phone) here MUST match the Google Business Profile
 * exactly, or the mismatch hurts local ranking. Facts come from lib/site.ts.
 */
export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "SeniorCare"],
    "@id": `${SITE_URL}/#business`,
    name: BUSINESS.name,
    description: BUSINESS.descriptor,
    url: SITE_URL,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.address.street,
      addressLocality: BUSINESS.address.city,
      addressRegion: BUSINESS.address.state,
      postalCode: BUSINESS.address.zip,
      addressCountry: "US",
    },
    areaServed: [
      "Loganville, GA",
      "Monroe, GA",
      "Grayson, GA",
      "Gwinnett County, GA",
      "Walton County, GA",
    ],
    knowsAbout: [
      "personal care home",
      "senior living",
      "memory care",
    ],
    award: `${AWARD.year} ${AWARD.label}`,
    employee: {
      "@type": "Person",
      name: BUSINESS.director.name,
      jobTitle: BUSINESS.director.title,
    },
  };
}
