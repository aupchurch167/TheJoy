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
import { localBusinessJsonLd } from "@/lib/schema";
import type { Metadata } from "next";
import { BUSINESS } from "@/lib/site";
import { hasDatabase } from "@/lib/db";
import { getPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

// Homepage SEO. Description carries the §5 homepage keyword cluster in Joy
// voice and §4 compliance: senior living / personal care home / memory care,
// with "assisted living" only as the search category, never Joy's label.
export const metadata: Metadata = {
  title: `${BUSINESS.name} | Personal Care & Memory Care in Loganville, GA`,
  description: `A ${BUSINESS.beds}-resident personal care home and memory care in ${BUSINESS.address.city}, Georgia. Small enough to know your parent by name. Book a tour or call ${BUSINESS.phone}.`,
  keywords: [
    "the joy senior living of loganville",
    "joy senior living reviews",
    "assisted living loganville ga",
    "assisted living in loganville ga",
    "memory care loganville ga",
    "small assisted living georgia",
    "personal care home loganville ga",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: `${BUSINESS.name} | Personal Care & Memory Care in Loganville, GA`,
    description: BUSINESS.descriptor,
    url: "/",
    siteName: BUSINESS.name,
    locale: "en_US",
    type: "website",
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

  return (
    <>
      {/* schema.org structured data for local SEO (SeniorCare/LocalBusiness). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd()),
        }}
      />
      <Hero />
      <TrustStrip />
      <Difference />
      <ATuesday />
      <HomeServices />
      <MemoryCareHome />
      <Objection />
      <MeetMellissa />
      <Testimonials />
      <Awards />
      <CommunityPhotos />
      <Faq />
      <LatestPosts posts={postCards} />
      <FinalCta />
    </>
  );
}
