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

/**
 * Keywords tracked by the nightly SEO rank logger (§5 cluster). Edit freely.
 * The cron records each one's Google position (needs a SERPAPI_KEY; otherwise
 * it no-ops). The admin SEO page shows the trend.
 */
export const TRACKED_KEYWORDS: string[] = [
  "the joy senior living of loganville",
  "joy senior living reviews",
  "joy assisted living",
  "assisted living loganville ga",
  "assisted living in loganville ga",
  "assisted living loganville",
  "memory care loganville ga",
  "small assisted living georgia",
  "personal care home loganville ga",
];

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

/* ------------------------------------------------------------------ */
/* ABOUT PAGE (/about)                                                  */
/* ------------------------------------------------------------------ */

export const ABOUT = {
  heading: "About Joy",
  lede: `Joy started with a simple idea: a person does not stop being themselves because they need help.`,
  story: [
    `Later life still holds mornings worth getting up for. A favorite chair by the window. A joke told the same way for forty years. A good home protects those things, and builds the day around them.`,
    `Joy has ${BUSINESS.beds} beds. We chose that number and we guard it. Small is not a limitation here, it is the whole design. It is what lets ${BUSINESS.director.name} and her team learn your mother in a week, not a season: how she takes her coffee, which songs she hums, when she gets tired.`,
  ],
  dayHeading: "What a day here feels like",
  day: [
    `A day at Joy is quiet in the way a home is quiet. Coffee in the morning. The smell of lunch from a real kitchen. Someone sitting with your father while he tells a story you have heard before and they have not.`,
    `Because the same people are here every day, they notice the small things: a harder night, a lost appetite, a word that would not come. At a larger place those signs get missed. Here they get caught, and ${BUSINESS.director.name} hears about them that day.`,
  ],
  mellissaHeading: "The person who sets the tone",
  mellissa: [
    `${BUSINESS.director.name} leads Joy as ${BUSINESS.director.title}. She is usually the first person a family meets, and often the last one they call at night with a question. She sets the standard everyone here follows: treat each resident like a parent, because to someone they are.`,
  ],
  licenseNote: `Joy is licensed by the State of Georgia as a personal care home. That license shapes what we do: help with the daily tasks of living, medications, meals, and steady human company, in a setting small enough to stay personal.`,
  photos: [
    { src: "/images/community-1.jpg", alt: "The front porch at Joy Senior Living in Loganville" },
    { src: "/images/community-4.jpg", alt: "The common living room at Joy Senior Living" },
  ],
} as const;

/* ------------------------------------------------------------------ */
/* SERVICES PAGE (/services)                                           */
/* ------------------------------------------------------------------ */

export const SERVICES = {
  heading: "What Joy offers",
  lede: `Joy is a personal care home in Loganville offering senior living and memory care. Here is what that means in plain terms.`,
  careHeading: "Personal care, day to day",
  care: [
    `Joy helps with the things that get harder to do alone: bathing, dressing, grooming, moving safely from room to room. Medications are given on time, by staff who know each resident, not handed from a cart to strangers.`,
    `Meals are cooked here and eaten at a shared table, because sitting down together is part of the care, not separate from it. Someone is awake and on-site around the clock.`,
  ],
  // §4: memory care is an allowed claim; confirm it is within the license
  // before launch (MEMORY_CARE.enabled gates it site-wide, see OPERATIONS.md).
  memoryHeading: "Memory care, within our personal care home",
  memory: [
    `For families facing memory loss, Joy offers memory care inside our personal care home. The setting is the same small one, with the same familiar faces, which matters more for a person living with dementia than almost anything else.`,
    `${BUSINESS.director.name} can walk you through what memory care at Joy looks like for your parent, honestly, before you decide anything.`,
  ],
  scaleHeading: "Why the small scale changes everything",
  scale: [
    `The difference at Joy is not a longer list of services. It is the scale. ${BUSINESS.beds} residents means the person helping your mother today is the same one who helped her yesterday and will tomorrow. It means a change in her gets noticed by someone who knows her, not logged by someone passing through.`,
  ],
  // §4 search-context framing: assisted living named only as the search
  // category, followed by what Joy actually is.
  assistedLivingContext: `If you are looking for assisted living in Loganville, it helps to know the difference. Joy is a personal care home, a distinct Georgia license. Families searching for assisted living near Loganville often find that a smaller personal care home like Joy is a better fit for a parent who would feel lost in a large building.`,
} as const;
