/**
 * Joy Senior Living — single source of truth for facts and homepage copy.
 *
 * Adam: almost everything a non-developer needs to change lives in THIS file.
 * Edit the strings here, save, and the site updates. Two hard rules govern
 * every word (see the full brief):
 *
 *   VOICE (§2): No em-dashes (use parentheses). No banned words:
 *     "loved ones", "vibrant", "journey", "personalized care plans",
 *     "boutique", "intimate" (say "small"), "top-tier", "deserve more".
 *     Short sentences. Real detail over reassurance. Name Mellissa.
 *
 *   COMPLIANCE (§4): Joy is a Georgia PERSONAL CARE HOME, not an assisted
 *     living facility. Never call Joy "assisted living". You may reference
 *     "assisted living" only as the category families SEARCH for, then say
 *     what Joy actually is.
 */

/** Business facts. Keep these identical to the Google Business Profile (NAP). */
export const BUSINESS = {
  name: "Joy Senior Living",
  legalDescriptor: "personal care home",
  // Descriptor line used in meta + hero. Do not reword without checking §4.
  descriptor: "Senior living and memory care (personal care home) in Loganville, GA.",
  phone: "(470) 684-3569",
  phoneHref: "tel:+14706843569",
  email: "hello@joyseniorcare.com",
  emailHref: "mailto:hello@joyseniorcare.com",
  // VERIFY against the Google listing before launch (see OPERATIONS.md checklist).
  address: {
    street: "434 Conyers Rd",
    city: "Loganville",
    state: "GA",
    zip: "30052",
  },
  beds: 24,
  director: {
    name: "Mellissa Daniel",
    title: "Executive Director",
  },
} as const;

export const BUSINESS_ADDRESS_ONE_LINE = `${BUSINESS.address.street}, ${BUSINESS.address.city}, ${BUSINESS.address.state} ${BUSINESS.address.zip}`;

/**
 * The ONE tour path for the whole site (TalkFurther). The old site had three
 * conflicting CTAs; this is the single one. Set the real TalkFurther URL in
 * the NEXT_PUBLIC_TALKFURTHER_URL env var (Railway). Until then this falls
 * back to the phone number so the button never dead-ends.
 */
export const TOUR_URL =
  process.env.NEXT_PUBLIC_TALKFURTHER_URL || BUSINESS.phoneHref;

/** Public site URL (used for canonical links, sitemap, schema). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://joyseniorcare.com"
).replace(/\/$/, "");

/** The award badge. Update the year here each year. */
export const AWARD = {
  label: "A Place for Mom Best of Senior Living",
  year: "2026",
} as const;

/* ------------------------------------------------------------------ */
/* HOMEPAGE COPY                                                        */
/* ------------------------------------------------------------------ */

export const HERO = {
  // KEPT VERBATIM. The best asset on the site. Do not "improve" this line.
  headline: "A senior living home small enough to know your parent by name.",
  sub: `${BUSINESS.beds} residents. One small community in Loganville, led by ${BUSINESS.director.name}.`,
  ctaLabel: "Book a tour",
} as const;

/** Section 2: the difference, in plain words. Prose, no icon grid. */
export const DIFFERENCE = {
  heading: "What small actually means",
  body: [
    `Joy has ${BUSINESS.beds} beds. That number is the whole point. ${BUSINESS.director.name} and her team learn how your mother takes her coffee, which chair your father claims after breakfast, the name of the dog he raised years ago. Known by name is not a slogan here. It is what ${BUSINESS.beds} residents allow.`,
    `Larger places count residents in the hundreds, and a single staff member may cover a whole floor. At Joy the same faces greet your parent every morning. When something shifts (a harder night, a lost appetite, a new worry) someone notices that day, not next week.`,
    `Joy is a personal care home. That is the license Georgia grants us, and it shapes the days here: help with bathing and dressing, medications on time, real meals at a shared table, and the steady company of people who know your parent well.`,
  ],
} as const;

/**
 * Memory care paragraph. §4: "memory care" is an allowed claim, but the
 * pre-launch checklist requires confirming it falls within Joy's personal
 * care home license. If confirmed, this renders. If not yet confirmed,
 * set `enabled` to false and it disappears from the page.
 */
export const MEMORY_CARE = {
  enabled: true,
  heading: "For families facing memory loss",
  body: `When a parent is living with dementia, the questions get harder and the days get longer. Joy offers memory care inside our personal care home, with the same small scale and the same familiar faces. ${BUSINESS.director.name} can walk you through what that looks like for your parent, honestly, before you decide anything.`,
} as const;

/**
 * Search-context paragraph. This is how we appear for "assisted living
 * Loganville" searches WITHOUT ever calling Joy assisted living (§4).
 * Uses the approved patterns from the brief.
 */
export const ASSISTED_LIVING_CONTEXT = {
  body: `If you are looking for assisted living in Loganville, Joy is a personal care home that offers much of what those families need: help with daily tasks, medication management, meals, and staff on-site around the clock. Families searching for assisted living near Loganville often find that a smaller personal care home like Joy is a better fit for a parent who would feel lost in a large building.`,
} as const;

/** Section 3: Meet Mellissa. */
export const MELLISSA = {
  heading: "Meet Mellissa",
  // Safe, true, third-person intro. Always shows.
  intro: `${BUSINESS.director.name} is Joy's ${BUSINESS.director.title}. She leads the team that cares for every resident, and she is usually the first person a family meets.`,
  /**
   * IMPORTANT: These must be Mellissa's OWN words. Do not fabricate.
   * Ask Mellissa for two or three honest first-person sentences and paste
   * them below. While this is an empty string, the quote block is hidden
   * and the page still reads cleanly. (See OPERATIONS.md.)
   */
  quote: "",
  photo: "/images/mellissa.jpg", // real photo of Mellissa; see photo manifest
} as const;

/**
 * Section 4: real testimonials. Lead with Mike S., then Cathy's fall story.
 * ONLY real quotes ship. Entries with an empty `quote` are skipped, so the
 * section never shows a fabricated testimonial. Paste the real wording from
 * the current site (see OPERATIONS.md) to turn each one on.
 */
export const TESTIMONIALS: {
  quote: string;
  name: string;
  context?: string;
}[] = [
  {
    // Real, verbatim. Keep first.
    quote: "I like my new home.",
    name: "Mike S.",
    context: "Resident",
  },
  {
    // Cathy's fall story. Paste her real testimonial from the current site.
    quote: "",
    name: "Cathy",
    context: "Resident's family",
  },
];

/** Section 5: community photos (real only, no stock). See photo manifest. */
export const COMMUNITY_PHOTOS: { src: string; alt: string }[] = [
  { src: "/images/community-1.jpg", alt: "The front porch and entrance at Joy Senior Living in Loganville" },
  { src: "/images/community-2.jpg", alt: "Residents and staff around the shared dining table at Joy" },
  { src: "/images/community-3.jpg", alt: "A resident's room at Joy Senior Living" },
  { src: "/images/community-4.jpg", alt: "The common living room at Joy Senior Living" },
];

export const HERO_PHOTO = {
  src: "/images/hero.jpg",
  alt: "The building at Joy Senior Living, a small senior living home in Loganville, Georgia",
};

/**
 * Section 6: latest blog posts. In Phase 2 this is replaced by the Postgres
 * blog. For now these are evergreen teasers in Joy voice. Edit freely; set
 * to an empty array to hide the whole section.
 */
export const LATEST_POSTS: {
  title: string;
  excerpt: string;
  href: string;
}[] = [
  {
    title: "How to tell when a parent needs more help at home",
    excerpt:
      "The signs are rarely loud. A stack of unopened mail. The same story twice in ten minutes. Here is what families notice first, and what it usually means.",
    href: "/blog",
  },
  {
    title: "Why a smaller home can be the safer choice",
    excerpt:
      "Bigger is not always safer. In a home of 24, a change in your parent gets noticed the same day. We explain what small scale actually changes.",
    href: "/blog",
  },
  {
    title: "Talking to your parent about moving, without the fight",
    excerpt:
      "Most of these conversations start badly. A few honest words from Mellissa on how to begin, and what to avoid, when it is time to talk.",
    href: "/blog",
  },
];
