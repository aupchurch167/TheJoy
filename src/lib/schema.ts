import { AWARD, BUSINESS, SITE_URL } from "./site";
import type { Post } from "./posts";

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
