import Hero from "@/components/sections/Hero";
import TrustStrip from "@/components/sections/TrustStrip";
import Difference from "@/components/sections/Difference";
import ATuesday from "@/components/sections/ATuesday";
import HomeServices from "@/components/sections/HomeServices";
import MemoryCareHome from "@/components/sections/MemoryCareHome";
import Objection from "@/components/sections/Objection";
import MeetMellissa from "@/components/sections/MeetMellissa";
import Testimonials from "@/components/sections/Testimonials";
import CommunityPhotos from "@/components/sections/CommunityPhotos";
import Awards from "@/components/sections/Awards";
import Faq from "@/components/sections/Faq";
import LatestPosts from "@/components/sections/LatestPosts";
import FinalCta from "@/components/sections/FinalCta";
import { localBusinessJsonLd, faqPageJsonLd } from "@/lib/schema";
import type { Metadata } from "next";
import { BUSINESS, OG_IMAGE } from "@/lib/site";
import { hasDatabase } from "@/lib/db";
import { getPublishedPosts } from "@/lib/posts";
import { getSitePhotos } from "@/lib/site-photos";

export const dynamic = "force-dynamic";

// Homepage SEO. Description carries the §5 homepage keyword cluster in Joy
// voice and §4 compliance: senior living / personal care home / memory care,
// with "assisted living" only as the search category, never Joy's label.
export const metadata: Metadata = {
  // `absolute` bypasses the root layout's "%s | Joy Senior Living" template, so
  // the brand-first homepage title is not double-branded. (The `keywords` meta
  // tag was removed: Google ignores it and it only advertised our targets.)
  title: {
    absolute: `${BUSINESS.name} | Personal Care & Memory Care in Loganville, GA`,
  },
  description: `A ${BUSINESS.beds}-resident personal care home and memory care in ${BUSINESS.address.city}, Georgia. Small enough to know your parent by name. Book a tour or call ${BUSINESS.phone}.`,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${BUSINESS.name} | Personal Care & Memory Care in Loganville, GA`,
    description: BUSINESS.descriptor,
    url: "/",
    siteName: BUSINESS.name,
    locale: "en_US",
    type: "website",
    images: [OG_IMAGE],
  },
};

export default async function Home() {
  // Pull the 3 latest published posts for the Stories section (falls back to
  // the static teasers in site.ts when there are none yet).
  const dbPosts = hasDatabase() ? await getPublishedPosts(3) : [];
  const postCards = dbPosts.map((p) => ({
    title: p.title,
    excerpt: p.excerpt || "",
    href: `/blog/${p.slug}`,
  }));

  // Use the admin-uploaded logo for the business schema image when set.
  const { logo } = await getSitePhotos();
  const schemaImage = logo.set && /^https?:\/\//.test(logo.src) ? logo.src : undefined;

  return (
    <>
      {/* schema.org structured data for local SEO (SeniorCare/LocalBusiness). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd({ image: schemaImage })),
        }}
      />
      {/* FAQPage markup, mirroring the visible FAQ (memory-care item gated). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageJsonLd()),
        }}
      />
      {/* Ordered as a story for a family researching care:
          relief (hero) -> credible (trust strip) -> the idea (small) ->
          a day here -> see the home -> meet Mellissa -> what we handle ->
          memory care -> the doubt -> families -> awards -> stories ->
          your questions -> come see it. */}
      <Hero />
      <TrustStrip />
      <Difference />
      <ATuesday />
      <CommunityPhotos />
      <MeetMellissa />
      <HomeServices />
      <MemoryCareHome />
      <Objection />
      <Testimonials />
      <Awards />
      <LatestPosts posts={postCards} />
      <Faq />
      <FinalCta />
    </>
  );
}
