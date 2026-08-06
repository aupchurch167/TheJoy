import {
  AWARD,
  BUSINESS,
  FAQ,
  MEMORY_CARE,
  ORG_PROFILE,
  SITE_URL,
  visibleServiceDetails,
} from "./site";
import type { Post } from "./posts";
import type { ServiceDetail } from "./site";

/**
 * schema.org structured data for local SEO. Uses SeniorCare + LocalBusiness.
 * The NAP (name, address, phone) here MUST match the Google Business Profile
 * exactly, or the mismatch hurts local ranking. Facts come from lib/site.ts.
 *
 * §4 COMPLIANCE: this markup NEVER declares Joy an "AssistedLivingFacility" and
 * never states it offers assisted living. The type stays LocalBusiness and the
 * description frames "assisted living" only as the category families search.
 *
 * `opts.image` lets the homepage pass the admin-uploaded logo; otherwise it
 * falls back to the hosted logo in ORG_PROFILE.
 */
export function localBusinessJsonLd(opts?: { image?: string }) {
  const image = opts?.image || ORG_PROFILE.image;
  const tel = BUSINESS.phoneHref.replace(/^tel:/, ""); // E.164, e.g. +14706843569

  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "SeniorCare"],
    "@id": `${SITE_URL}/#business`,
    name: BUSINESS.name,
    alternateName: ORG_PROFILE.alternateName,
    description: ORG_PROFILE.description,
    url: SITE_URL,
    image,
    logo: image,
    telephone: tel,
    email: BUSINESS.email,
    priceRange: ORG_PROFILE.priceRange,
    openingHours: ORG_PROFILE.openingHours,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.address.street,
      addressLocality: BUSINESS.address.city,
      addressRegion: BUSINESS.address.state,
      postalCode: BUSINESS.address.zip,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: ORG_PROFILE.geo.latitude,
      longitude: ORG_PROFILE.geo.longitude,
    },
    areaServed: ORG_PROFILE.areaServed,
    knowsAbout: ["personal care home", "senior living", "memory care"],
    award: `${AWARD.year} ${AWARD.label}`,
    sameAs: ORG_PROFILE.sameAs,
    employee: {
      "@type": "Person",
      name: BUSINESS.director.name,
      jobTitle: BUSINESS.director.title,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Care Services",
      // Only services actually offered (memory care is gated), with the
      // current site URLs (memory care lives at its own /memory-care page).
      itemListElement: visibleServiceDetails().map((s) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: s.name,
          url:
            s.slug === "memory-care"
              ? `${SITE_URL}/memory-care`
              : `${SITE_URL}/services/${s.slug}`,
        },
      })),
    },
  };
}

/**
 * schema.org FAQPage markup for the homepage FAQ. Built from the same FAQ
 * array the visible <Faq> component renders, with the memory-care question
 * gated identically (§4), so the structured data never states more than the
 * page shows. The answers are the exact on-page text (no invented specifics).
 */
export function faqPageJsonLd() {
  const items = FAQ.filter(
    (f) => f.gated !== "memory" || MEMORY_CARE.enabled
  );
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

/** schema.org Service markup for a service detail page, tied to the business. */
export function serviceJsonLd(service: ServiceDetail) {
  const url = `${SITE_URL}/services/${service.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: service.name,
    description: service.metaDescription,
    serviceType: service.name,
    url,
    provider: {
      "@type": ["LocalBusiness", "SeniorCare"],
      "@id": `${SITE_URL}/#business`,
      name: BUSINESS.name,
    },
    areaServed: ["Loganville, GA", "Walton County, GA", "Gwinnett County, GA"],
  };
}

/** schema.org Article markup for a blog post. */
export function articleJsonLd(post: Post) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.meta_description || post.excerpt || undefined,
    image: post.hero_image || undefined,
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at || post.published_at || undefined,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: BUSINESS.name,
      url: SITE_URL,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}
