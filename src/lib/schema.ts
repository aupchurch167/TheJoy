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

/**
 * schema.org FAQPage built from any {title, body} FAQ list (the funnel and
 * serving pages store their FAQs this way and render them through <Accordion>).
 * Built from the SAME array the visible accordion renders, so the structured
 * data never states more than the page shows. `id` anchors the block per page.
 */
export function faqPageJsonLdFrom(
  items: { title: string; body: string }[],
  id: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": id,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.title,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.body,
      },
    })),
  };
}

/**
 * schema.org Service for a town serving page, tied to the business, with
 * areaServed set to the town. §4: serviceType stays "personal care home".
 */
export function servingServiceJsonLd(town: { name: string; slug: string }) {
  const url = `${SITE_URL}/serving/${town.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: `Senior living and personal care near ${town.name}, GA`,
    serviceType: "Personal care home",
    url,
    provider: {
      "@type": ["LocalBusiness", "SeniorCare"],
      "@id": `${SITE_URL}/#business`,
      name: BUSINESS.name,
    },
    areaServed: `${town.name}, GA`,
  };
}

/**
 * schema.org Service markup for a service page, tied to the business. `opts.url`
 * overrides the default /services/<slug> URL (memory care lives at /memory-care).
 */
export function serviceJsonLd(
  service: ServiceDetail,
  opts?: { url?: string }
) {
  const url = opts?.url ?? `${SITE_URL}/services/${service.slug}`;
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

/**
 * schema.org CollectionPage for the /services overview, listing the visible
 * services (memory care links to its own /memory-care page).
 */
export function servicesCollectionJsonLd() {
  const url = `${SITE_URL}/services`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#services`,
    url,
    name: "Care services at Joy Senior Living",
    about: { "@id": `${SITE_URL}/#business` },
    hasPart: visibleServiceDetails().map((s) => ({
      "@type": "Service",
      name: s.name,
      url:
        s.slug === "memory-care"
          ? `${SITE_URL}/memory-care`
          : `${SITE_URL}/services/${s.slug}`,
    })),
  };
}

/**
 * schema.org Person for Mellissa Daniel, Joy's Executive Director. She is the
 * site's E-E-A-T anchor (a registered nurse with 20+ years of experience, per
 * the owner-supplied ORG_PROFILE). Referenced by @id from the AboutPage.
 */
export function mellissaPersonJsonLd() {
  return {
    "@type": "Person",
    "@id": `${SITE_URL}/#mellissa`,
    name: BUSINESS.director.name,
    jobTitle: BUSINESS.director.title,
    description:
      "Executive Director at Joy Senior Living and a registered nurse with more than 20 years of experience.",
    url: `${SITE_URL}/about`,
    worksFor: {
      "@type": ["LocalBusiness", "SeniorCare"],
      "@id": `${SITE_URL}/#business`,
      name: BUSINESS.name,
    },
  };
}

/** schema.org AboutPage for /about, with Mellissa's Person entity in a graph. */
export function aboutPageJsonLd() {
  const url = `${SITE_URL}/about`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${url}#about`,
        url,
        name: `About ${BUSINESS.name}`,
        about: { "@id": `${SITE_URL}/#business` },
        mainEntity: { "@id": `${SITE_URL}/#mellissa` },
      },
      mellissaPersonJsonLd(),
    ],
  };
}

/** schema.org ContactPage for /tour (book-a-tour / contact hub). */
export function contactPageJsonLd() {
  const url = `${SITE_URL}/tour`;
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${url}#contact`,
    url,
    name: "Book a tour of Joy Senior Living",
    about: { "@id": `${SITE_URL}/#business` },
  };
}

/** schema.org Blog for the /blog index, listing published posts. */
export function blogCollectionJsonLd(
  posts: { slug: string; title: string; published_at?: string | null }[]
) {
  const url = `${SITE_URL}/blog`;
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${url}#blog`,
    url,
    name: "Stories from Joy",
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#business`,
      name: BUSINESS.name,
    },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.published_at || undefined,
    })),
  };
}

/** schema.org BreadcrumbList. Pass site-relative paths in trail order. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

/**
 * Real Joy people who earn a Person author (the E-E-A-T signal the field exists
 * to send). Anyone or anything NOT here (the company name, or a stray/imported
 * byline) is the publishing Organization, not a Person named after a company.
 * Keyed by lowercased full name. Mellissa references her established Person
 * entity (an RN byline on care topics is worth more than any backlink).
 */
const PERSON_AUTHORS: Record<
  string,
  { name: string; url: string; id?: string; jobTitle?: string; credential?: string }
> = {
  "mellissa daniel": {
    name: BUSINESS.director.name,
    url: `${SITE_URL}/about`,
    id: `${SITE_URL}/#mellissa`,
    jobTitle: BUSINESS.director.title,
    credential: "RN",
  },
  "adam upchurch": {
    name: "Adam Upchurch",
    url: `${SITE_URL}/about`,
  },
};

// Bare-first-name bylines (from the old import) resolve to the same people, so
// a post authored "Mellissa" still gets her Person entity, not an Organization.
PERSON_AUTHORS["mellissa"] = PERSON_AUTHORS["mellissa daniel"];
PERSON_AUTHORS["adam"] = PERSON_AUTHORS["adam upchurch"];

/** Normalize a stored author (slug like "adam-upchurch" or a plain name). */
function normalizeAuthorName(author: string): string {
  const a = (author || "").trim();
  if (!a) return BUSINESS.name;
  if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(a)) {
    return a
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return a;
}

/** Look up a real-person author profile, or null if it is not a known person. */
function personProfile(author: string) {
  return PERSON_AUTHORS[normalizeAuthorName(author).toLowerCase()] ?? null;
}

/**
 * The schema.org author entity for a post: a Person only for a known real
 * person (Adam, Mellissa), otherwise the Organization. Never a Person named
 * after the company.
 */
function authorEntity(author: string) {
  const p = personProfile(author);
  if (p) {
    return {
      "@type": "Person",
      ...(p.id ? { "@id": p.id } : {}),
      name: p.name,
      ...(p.jobTitle ? { jobTitle: p.jobTitle } : {}),
      url: p.url,
    };
  }
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#business`,
    name: BUSINESS.name,
    url: SITE_URL,
  };
}

/**
 * Human byline for a post. A known person shows their name and credential (e.g.
 * "Mellissa Daniel, RN"); anything else shows the organization name.
 */
export function authorByline(author: string): string {
  const p = personProfile(author);
  if (p) return p.credential ? `${p.name}, ${p.credential}` : p.name;
  return BUSINESS.name;
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
    // Person only for a real person (E-E-A-T on a YMYL senior-care site);
    // the company name and stray bylines are the Organization, not a Person.
    author: authorEntity(post.author),
    publisher: {
      "@type": "Organization",
      name: BUSINESS.name,
      url: SITE_URL,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}
