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
 * Award / recognition badges shown on the homepage. Real third-party awards
 * only. Images live in /public/images/badges. `requiresMemoryCare` hides a
 * badge unless MEMORY_CARE.enabled (so we never claim memory care recognition
 * if memory care is not offered). To update the year, replace the image file.
 */
export const BADGES: { src: string; alt: string; requiresMemoryCare?: boolean }[] = [
  {
    src: "/images/badges/apfm-best-of-senior-living.png",
    alt: "A Place for Mom Best of Senior Living award badge",
  },
  {
    src: "/images/badges/best-in-senior-living.png",
    alt: "Best in Senior Living award from Assisted Living Magazine",
  },
  {
    src: "/images/badges/best-in-memory-care.png",
    alt: "Best in Memory Care award from Assisted Living Magazine",
    requiresMemoryCare: true,
  },
];

/**
 * Joy's public social profiles. Shown as text links in the footer. Add or
 * remove an entry and the footer updates. Leave the list empty to hide the
 * whole "Follow along" block.
 */
export const SOCIAL: { label: string; href: string }[] = [
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61556203663827" },
  { label: "Instagram", href: "https://www.instagram.com/joyseniorliving" },
];

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
  // The built-in default headline. This is now editable from the admin (Site
  // settings > Homepage headline, key hero_headline); an empty setting falls
  // back to this line. Earlier lines ("Twenty-four residents. That's the whole
  // idea." and "a home small enough to know your parent by name") still live in
  // the meta description and footer.
  headline: "You can go back to being a daughter.",
  sub: `Joy is a personal care home and memory care in ${BUSINESS.address.city}, Georgia (small enough that we learn how your mother takes her coffee and which chair your father claims after breakfast).`,
  ctaLabel: "Book a tour",
  // Rendered next to the tour button.
  callLine: `Or call and ask for ${BUSINESS.director.name.split(" ")[0]}: ${BUSINESS.phone}`,
} as const;

/**
 * Thin trust bar under the hero. Plain, verifiable facts (no reassurance
 * language). Keep every item true to the license and the Google listing.
 */
export const TRUST_STRIP: string[] = [
  "Licensed personal care home, State of Georgia",
  `${BUSINESS.beds} residents`,
  "Staff on-site 24 hours",
  `${BUSINESS.address.street}, ${BUSINESS.address.city}`,
];

/** Section 2: the difference, in plain words. Prose, no icon grid. */
export const DIFFERENCE = {
  heading: `What "small" actually means`,
  body: [
    `It is arithmetic. Joy has ${BUSINESS.beds} residents, and that number is the whole design. A large community counts its residents in the hundreds, and one aide may cover a full floor. Here, the same few faces greet your parent every morning.`,
    `That scale is what lets ${BUSINESS.director.name} and her team actually know your mother: how she takes her coffee, which chair your father claims after breakfast, the name of the dog he raised years ago. "Known by name" is not a slogan. It is what ${BUSINESS.beds} residents allow.`,
    `And it changes the thing that matters most. When something shifts (a harder night, a lost appetite, a new worry) someone notices that day, because they knew what normal looked like yesterday.`,
  ],
} as const;

/**
 * Section: "A Tuesday at Joy". A plain, specific picture of a day. Detail over
 * reassurance (§2). Not a schedule anyone has to follow, just the shape of one.
 */
export const A_TUESDAY = {
  heading: "A Tuesday at Joy",
  intro: `Nothing here runs on a schedule for its own sake. But a day has a shape, and it helps to picture a plain one.`,
  parts: [
    {
      label: "Breakfast",
      body: `Eggs cooked in the kitchen here, not trucked in and reheated. Coffee the way each person takes it, because the staff already know.`,
    },
    {
      label: "Mornings",
      body: `Someone helps with a shower and dressing, unhurried. Then stretching in the living room, a walk to the porch, or just the paper and quiet.`,
    },
    {
      label: "Afternoons",
      body: `Lunch at a shared table. After that a card game, a craft, music, or a nap. Nothing is mandatory. The point is to offer, not to push.`,
    },
    {
      label: "Nights",
      body: `Dinner, then the house settles. Someone is awake and on-site the whole night, so help at three in the morning is the same as help at three in the afternoon.`,
    },
  ],
} as const;

/**
 * Section: "What we handle". The daily work of care, stated plainly. Kept as a
 * short, specific list (not an icon grid, not reassurance filler). The memory
 * care line is gated by MEMORY_CARE.enabled in the component.
 */
export const HOME_SERVICES = {
  heading: "What we handle",
  lede: `The daily work of care, done by people who know your parent (not handed off to strangers).`,
  items: [
    "Bathing, dressing, and grooming",
    "Medications, given on time",
    "Three meals a day, cooked here",
    "Housekeeping and laundry",
    "Staff awake and on-site, 24 hours",
    "Coordination with doctors, home health, and hospice",
  ],
  memoryItem: "Memory care, inside the same home",
  note: `Joy is licensed by the State of Georgia as a personal care home. That license shapes what we can do, and we will always tell you honestly if a parent needs more than we offer.`,
} as const;

/**
 * Memory care section. §4: "memory care" is an allowed claim, but the
 * pre-launch checklist requires confirming it falls within Joy's personal
 * care home license. If confirmed, this renders (and gates the memory-care
 * badge, service page, and nav item). If not yet confirmed, set `enabled`
 * to false and it disappears everywhere.
 *
 * NOTE: The copywriter suggested a line about residents "not having to move"
 * as needs progress. That is a licensing claim we have NOT verified, so it is
 * intentionally left out. Confirm with the state license before adding it.
 */
export const MEMORY_CARE = {
  enabled: true,
  heading: "When it's dementia",
  body: [
    `When a parent is living with dementia, the questions get harder and the days get longer. Joy offers memory care inside our personal care home, so the setting stays small and the faces stay familiar (which matters more for memory loss than almost anything else).`,
    `Routine does a lot of the work. Meals, rest, and activity happen at the same times, in the same places, with the same people. ${BUSINESS.director.name} can walk you through what that looks like for your parent, honestly, before you decide anything.`,
  ],
  ctaLabel: "Talk to Mellissa about memory care",
} as const;

/**
 * Educational content for the /memory-care page. This is general, widely
 * accepted information about what families see with dementia and how a small,
 * familiar setting with steady routine helps. It makes NO clinical claims and
 * NO promises about Joy's specific capabilities beyond what the license allows.
 * Every hard decision routes back to ${BUSINESS.director.name}. Keep it honest
 * and on-voice (§2): parentheses not em-dashes, prose, specific over reassuring.
 */
export const MEMORY_CARE_EDUCATION = {
  // The visual "steady day" rhythm. Routine is the therapy, so we show it.
  rhythmHeading: "A day that doesn't change much, on purpose",
  rhythmLede: `For a person with memory loss, a predictable day does more than almost anything a building can offer. The shape below is the point: same order, same times, same faces.`,
  rhythm: [
    {
      label: "Morning",
      body: `Wake, wash, dress, breakfast. The same order, the same time, the same faces every day.`,
    },
    {
      label: "Midday",
      body: `Lunch at the shared table, then rest. The busiest hours are kept calm and quiet.`,
    },
    {
      label: "Afternoon",
      body: `Music, a walk, or simple hands-on activity. The point is to reach the person, not fill the hours.`,
    },
    {
      label: "Evening",
      body: `An early, unhurried dinner and a slow wind-down, before the harder hours of the day set in.`,
    },
  ],
  // Interactive, educational guide to the behaviors families actually see. Each
  // answer explains what is happening AND how a small, familiar home helps.
  signsHeading: "What you're seeing, and what it means",
  signsLede: `Dementia shows up in ways that are frightening the first time and confusing every time. Here is what some of the common ones mean, and why a small home changes how they feel. Tap any one to read more.`,
  signs: [
    {
      title: "She asks the same question over and over.",
      body: `Short-term memory fades first, so the question feels brand new to her each time, even seconds after you answered. Reminding her that she already asked rarely helps and often stings. A calm, familiar setting lowers the worry underneath the repetition, and staff who know her can answer the tenth time as gently as the first.`,
    },
    {
      title: "He wanders, especially late in the day.",
      body: `Restlessness and pacing are common, and they often peak in the late afternoon (sometimes called sundowning). Usually he is looking for something familiar: a person, a place, a routine from years ago. A small home with the same faces and a predictable evening gives him fewer reasons to feel lost, and a layout where he is never far from someone who knows him.`,
    },
    {
      title: "Some days he doesn't recognize me.",
      body: `This is one of the hardest parts, and it is not a choice or a failure of love. The brain's ability to place a face comes and goes. Meeting him in the moment he is in (without correcting him) keeps the visit warm. Staff who see him every day learn his good hours, and can tell you when he is most himself.`,
    },
    {
      title: "Evenings are harder than mornings.",
      body: `Confusion and agitation often grow as the day goes on and the light fades. Predictable routine eases it more than anything: the same dinner time, the same wind-down, the same people. A quiet, familiar house in the evening is far calmer than a large, busy building.`,
    },
    {
      title: "She won't eat, or forgets that she ate.",
      body: `Appetite and the very sense of hunger change with dementia, and pressure makes it worse. Meals at a shared table, on a steady schedule, with food she recognizes, help more than any reminder to eat. Because Joy is small, someone notices the day she skips a meal, not a week later.`,
    },
    {
      title: "I feel guilty even considering a move.",
      body: `Almost every family does. Caring for a parent with dementia at home can ask more than one person can give, and choosing help is not giving up. ${BUSINESS.director.name} has had this conversation many times. She will be honest with you about whether Joy is the right fit, or whether your parent needs more than a personal care home can offer.`,
    },
  ],
} as const;

/**
 * Objection handler. Names, honestly, who Joy is NOT right for. This builds
 * trust and keeps §4 straight: Joy is a personal care home, not a nursing home.
 */
export const OBJECTION = {
  heading: "Doesn't a smaller home mean less care?",
  body: [
    `It is a fair question, and the honest answer is that small is not the same as less. Joy has staff awake around the clock, medications managed by people who know each resident, and help on hand at every hour. What a large building adds is not more care. It is more residents per aide.`,
    `But Joy is not right for everyone. We are a personal care home, not a nursing home. If your parent needs skilled nursing (a ventilator, IV care, two-person transfers, wound care only a nurse can do) we will tell you plainly and help you find the right place. Saying so is part of the job.`,
  ],
} as const;

/**
 * Search-context paragraph. How we appear for "assisted living Loganville"
 * searches WITHOUT ever calling Joy assisted living (§4). Now surfaced through
 * the FAQ "Is Joy assisted living?" item; kept here for reuse.
 */
export const ASSISTED_LIVING_CONTEXT = {
  body: `If you are looking for assisted living in Loganville, Joy is a personal care home that offers much of what those families need: help with daily tasks, medication management, meals, and staff on-site around the clock. Families searching for assisted living near Loganville often find that a smaller personal care home like Joy is a better fit for a parent who would feel lost in a large building.`,
} as const;

/**
 * Homepage FAQ. Answers the questions families actually ask, in Joy voice.
 * Cost and openings are deliberately NOT invented (owner has not set a price,
 * and openings change): both answer with a call-to-ask. The memory-care item
 * is gated by MEMORY_CARE.enabled in the component.
 */
export const FAQ: { q: string; a: string; gated?: "memory" }[] = [
  {
    q: "Is Joy assisted living?",
    a: `Not exactly, and the difference matters. Joy is a personal care home, a distinct license the State of Georgia grants. If you are searching for assisted living in ${BUSINESS.address.city}, a small personal care home like Joy often fits a parent who would feel lost in a large building.`,
  },
  {
    q: "Do you offer memory care?",
    a: `Yes, inside the same personal care home, with the same small scale and the same familiar faces. ${BUSINESS.director.name} can tell you whether Joy is the right level of care for your parent.`,
    gated: "memory",
  },
  {
    q: "What does it cost?",
    a: `Cost depends on the room and the level of care your parent needs, so the honest answer is a short conversation, not a number on a page. Call ${BUSINESS.phone} and ask for ${BUSINESS.director.name.split(" ")[0]}, and she will walk you through it.`,
  },
  {
    q: "How do I know when it's time?",
    a: `The signs are rarely loud: a stack of unopened mail, the same story twice in ten minutes, a new unsteadiness on the stairs. If you are asking the question, it is usually worth a call. We can talk it through with no pressure.`,
  },
  {
    q: "Do you have openings?",
    a: `Openings change, and with ${BUSINESS.beds} rooms they can change quickly. Call ${BUSINESS.phone} to ask what is available now. If we are full, ${BUSINESS.director.name.split(" ")[0]} can tell you what the wait usually looks like.`,
  },
];

/** Section 3: Meet Mellissa. */
export const MELLISSA = {
  heading: "Meet Mellissa",
  // Safe, true, third-person intro. Always shows.
  intro: `${BUSINESS.director.name} is Joy's ${BUSINESS.director.title}. She leads the team that cares for every resident, and she is usually the first person a family meets (and often the last one they call at night with a question).`,
  /**
   * OWNER-SUPPLIED. Mellissa's story: why she does this work, how long she has,
   * what she believes about caring for someone's parent. Two or three honest
   * paragraphs, in her words or a faithful retelling she approves. Do NOT
   * fabricate a backstory. While this array is empty, the block stays hidden
   * and the page still reads cleanly. (See OPERATIONS.md.)
   */
  story: [] as string[],
  /**
   * IMPORTANT: Must be Mellissa's OWN words. Do not fabricate. Ask her for two
   * or three honest first-person sentences and paste them below. While this is
   * an empty string, the quote block is hidden.
   */
  quote: "",
  photo: "/images/mellissa.jpg", // real photo of Mellissa; see photo manifest
} as const;

/**
 * Featured pull quote for the top of the testimonials section. These are the
 * real words a resident said to his son, quoted in Mike S.'s review below.
 * Real words only, never fabricated. Set quote to "" to hide the feature.
 */
export const TESTIMONIAL_FEATURED = {
  quote: "I like my new home.",
  attribution: `What Mike's father said, unprompted, over coffee in his room at Joy.`,
} as const;

/**
 * Section 4: real testimonials from families (owner-supplied). These are real
 * people's words. We only ever EXCERPT them (front-loading the strongest line
 * and marking cuts with "..."); we never paraphrase or reword. That is why a
 * few keep phrasing the Joy house voice otherwise avoids (e.g. "loved one").
 * Entries with an empty `quote` are skipped, so the section never shows a
 * fabricated testimonial. Lead with Mike S. and Cathy (§3).
 */
export const TESTIMONIALS: {
  quote: string;
  name: string;
  context?: string;
}[] = [
  {
    quote: `Walking into The Joy with my dad was like walking into a sanctuary of caring and calm... So grateful for everyone at The Joy!`,
    name: "Mike S.",
    context: "Resident's son",
  },
  {
    quote: `We found The Joy through Caring.com. What a blessing!! The staff is fabulous and since all the rooms are only steps away from the central "nurse's station" they are easily able to keep a vigilant eye on my independent Dad.`,
    name: "Cathy",
    context: "Resident's daughter",
  },
  {
    quote: `The caring staff have made my mother feel like she is in her home and loved. They have fostered a family environment and hosted family gatherings. It is truly a 'joy' to have found this facility.`,
    name: "Theresa",
    context: "Resident's daughter",
  },
  {
    quote: `I have seen a lot of communities and this one by far was the absolute BEST!!! We immediately felt welcomed... we are so happy we moved our mom in here.`,
    name: "Sidney",
    context: "Resident's family",
  },
  {
    quote: `At the end of the day, their staff was the most engaging and caring. On top of that, it's a brand new building so everything was clean and smelled nice.`,
    name: "Nicole",
    context: "Resident's daughter",
  },
  {
    quote: `I have a wonderful friend here and I love going to see her. The staff is amazing! If you're looking for a special place this is it!`,
    name: "Jacquie",
    context: "Friend of a resident",
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
  respiteHeading: "Short stays and respite",
  respite: [
    `Not every stay is permanent. Joy offers respite care: a short stay, from a few days to a few weeks, in a real room with the same care every resident gets.`,
    `Families use it when a caregiver at home needs a break, when a parent is recovering after a hospital visit, or when you want your parent to try Joy before deciding anything. ${BUSINESS.director.name} can tell you what is open and when.`,
  ],
  scaleHeading: "Why the small scale changes everything",
  scale: [
    `The difference at Joy is not a longer list of services. It is the scale. ${BUSINESS.beds} residents means the person helping your mother today is the same one who helped her yesterday and will tomorrow. It means a change in her gets noticed by someone who knows her, not logged by someone passing through.`,
  ],
  // §4 search-context framing: assisted living named only as the search
  // category, followed by what Joy actually is.
  assistedLivingContext: `If you are looking for assisted living in Loganville, it helps to know the difference. Joy is a personal care home, a distinct Georgia license. Families searching for assisted living near Loganville often find that a smaller personal care home like Joy is a better fit for a parent who would feel lost in a large building.`,
} as const;

/* ------------------------------------------------------------------ */
/* SERVICE DETAIL PAGES (/services/<slug>)                             */
/* ------------------------------------------------------------------ */

/**
 * One page per service, rendered by /services/[slug]. Edit the copy here.
 * Two hard rules still apply (§2 voice, §4 compliance): no banned words, no
 * calling Joy "assisted living", name Mellissa where care is discussed.
 *
 * `gated: "memory"` ties a service to MEMORY_CARE.enabled, so memory care only
 * appears (card + page + sitemap) while that flag is true. The old Webflow URLs
 * (/service/<slug>) 301 to these via db/redirects.json.
 */
export type ServiceDetail = {
  slug: string;
  name: string;
  /** One line for the overview card and the page sub-headline. */
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
  gated?: "memory";
  /**
   * Card + page photo. Real photos only (no stock). The `src` is the code
   * default and shows a calm placeholder until the real file exists; an
   * operator can also swap it from /admin/photos (settingKey photo_service_*).
   */
  photo: { src: string; alt: string };
  /**
   * Interactive + educational blocks for the detail page: a visual "what to
   * expect" timeline and a Q&A accordion of the questions families ask. Same
   * treatment as the memory-care page. Optional; a service without it just
   * shows its prose sections. Keep answers honest and on-voice (§2), and never
   * invent specifics (route the unknowns to Mellissa).
   */
  education?: {
    stepsHeading: string;
    stepsLede?: string;
    steps: { label: string; body: string }[];
    faqsHeading: string;
    faqsLede?: string;
    faqs: { q: string; a: string }[];
  };
};

export const SERVICE_DETAILS: ServiceDetail[] = [
  {
    slug: "personal-care",
    name: "Personal care",
    tagline: "Help with the day, from people who know your parent by name.",
    metaTitle: "Personal Care in a Loganville Personal Care Home",
    metaDescription:
      "Personal care at Joy Senior Living in Loganville, GA: help with bathing, dressing, medications, meals, and around-the-clock support, at a scale small enough to know your parent by name.",
    photo: {
      src: "/images/services/personal-care.jpg",
      alt: "A caregiver helping a resident at Joy Senior Living in Loganville",
    },
    intro: `Joy is a personal care home in Loganville. Personal care is the heart of what we do: steady help with the parts of daily life that get harder to manage alone, given by people who know your parent as a person.`,
    sections: [
      {
        heading: "Help with the day, day to day",
        body: [
          `Joy helps with bathing, dressing, grooming, and moving safely from room to room. The help is hands-on when it needs to be and stays out of the way when it does not, and it always keeps your parent's dignity first.`,
          `Medications are given on time by staff who know each resident, not handed from a cart by someone passing through. Housekeeping and laundry are handled here, so the room stays clean and the clothes stay fresh without your parent lifting a finger.`,
        ],
      },
      {
        heading: "Real meals, and someone awake all night",
        body: [
          `Meals are cooked here and eaten at a shared table, and the kitchen works around real dietary needs. Someone is awake and on-site around the clock, so help is there at three in the morning the same as at three in the afternoon.`,
        ],
      },
      {
        heading: "Care built around one person",
        body: [
          `Because Joy has ${BUSINESS.beds} residents, ${BUSINESS.director.name} and her team can learn your parent: the routines, the preferences, the history. When something changes, they notice, because they knew what normal looked like yesterday.`,
        ],
      },
    ],
    education: {
      stepsHeading: "What a day of care looks like",
      stepsLede: `Nothing here runs on a rigid schedule, but the help arrives when it is needed. Here is the plain shape of a day.`,
      steps: [
        {
          label: "Morning",
          body: `Help with a shower, dressing, and grooming, at whatever pace the morning needs. Then breakfast at the shared table.`,
        },
        {
          label: "Midday",
          body: `Medications on time, from staff who know each resident. Lunch, then rest or company in the living room.`,
        },
        {
          label: "Afternoon",
          body: `A walk, a visit, or an activity if she wants one. Housekeeping and laundry happen quietly in the background.`,
        },
        {
          label: "Evening",
          body: `Dinner, evening medications, and help getting ready for bed. Someone stays awake and on-site all night.`,
        },
      ],
      faqsHeading: "Questions families ask",
      faqsLede: `The ones we hear most, answered plainly. Tap any to read more.`,
      faqs: [
        {
          q: "Will the same people care for my mother?",
          a: `As much as any home can promise. Joy has ${BUSINESS.beds} residents, so the faces stay familiar. That is the whole point of a small home: the person helping her today is usually the one who helped her yesterday.`,
        },
        {
          q: "What if she resists help with bathing?",
          a: `That is common, and it is usually about dignity, not the bath. Staff go slowly, keep her covered and warm, and never force it. Often it just takes the right person and the right time of day, which a small team learns quickly.`,
        },
        {
          q: "How are medications handled?",
          a: `Medications are given on schedule by staff who know each resident, and recorded each time. Nothing is handed from a cart to a stranger. ${BUSINESS.director.name} coordinates with your parent's doctors and pharmacy.`,
        },
        {
          q: "What happens if her needs increase?",
          a: `Joy is a personal care home, and there is a point where a parent needs skilled nursing beyond what we offer. If that day comes, ${BUSINESS.director.name} will tell you honestly and help you find the right next step.`,
        },
      ],
    },
  },
  {
    slug: "memory-care",
    name: "Memory care",
    tagline: "The same small home, the same familiar faces, for a parent living with memory loss.",
    metaTitle: "Memory Care in a Loganville Personal Care Home",
    metaDescription:
      "Memory care at Joy Senior Living in Loganville, GA, offered within our personal care home: a small, familiar setting with trained staff and steady routines for a parent living with dementia.",
    photo: {
      src: "/images/services/memory-care.jpg",
      alt: "A quiet, familiar common room used for memory care at Joy Senior Living",
    },
    intro: `For families facing memory loss, Joy offers memory care inside our personal care home. The setting is the same small one, with the same familiar faces, which matters more for a person living with dementia than almost anything else.`,
    gated: "memory",
    sections: [
      {
        heading: "Why routine matters here",
        body: [
          `Comfort comes from familiarity. Days follow a steady, predictable shape, because a reliable routine eases the fear that memory loss can bring. Meals, rest, and activity happen at the same times, in the same places, with the same people.`,
        ],
      },
      {
        heading: "Days with something in them",
        body: [
          `The point is not to fill the hours but to reach the person. Music, simple art, and gentle games can settle a hard afternoon and reach a memory that words no longer can. Staff are trained for memory care and lead with patience.`,
        ],
      },
      {
        heading: "Talk to Mellissa first",
        body: [
          `${BUSINESS.director.name} can walk you through what memory care at Joy looks like for your parent, honestly, before you decide anything. If Joy is not the right level of care for your parent, she will tell you that too.`,
        ],
      },
    ],
  },
  {
    slug: "respite-care",
    name: "Respite care",
    tagline: "A short stay, with the full care, when a family needs a break.",
    metaTitle: "Respite Care & Short Stays in Loganville, GA",
    metaDescription:
      "Respite care at Joy Senior Living in Loganville, GA: short stays from a few days to a few weeks, in a private room with the same care every resident receives.",
    photo: {
      src: "/images/services/respite-care.jpg",
      alt: "A guest room set up for a short respite stay at Joy Senior Living",
    },
    intro: `Not every stay is permanent. Joy offers respite care: a short stay, from a few days to a few weeks, in a private room with the same care every resident gets.`,
    sections: [
      {
        heading: "When families use it",
        body: [
          `Families choose respite when a caregiver at home needs a real break, when a parent is recovering after a hospital stay, or when you want your parent to try Joy before committing to a longer stay. The care is the full care, not a watered-down version of it.`,
        ],
      },
      {
        heading: "Ask what is open",
        body: [
          `Respite rooms depend on what is available. ${BUSINESS.director.name} can tell you what is open and when, and set up a stay that fits your family's timing.`,
        ],
      },
    ],
    education: {
      stepsHeading: "How a respite stay works",
      stepsLede: `A short stay is simpler than families expect. Here is the shape of one.`,
      steps: [
        {
          label: "Ask",
          body: `Call ${BUSINESS.director.name.split(" ")[0]} to see what rooms are open and when. Stays run from a few days to a few weeks.`,
        },
        {
          label: "Settle",
          body: `Your parent arrives to a real, furnished room and the same care every resident gets, not a watered-down version.`,
        },
        {
          label: "The stay",
          body: `Meals, medications, help with the day, and activities. You get a genuine break, and your parent is genuinely looked after.`,
        },
        {
          label: "Home",
          body: `When the stay ends, your parent goes home. Many families use a respite stay to test Joy before deciding on a longer one.`,
        },
      ],
      faqsHeading: "Questions families ask",
      faqsLede: `The ones we hear most, answered plainly. Tap any to read more.`,
      faqs: [
        {
          q: "How long can a stay be?",
          a: `From a few days to a few weeks, depending on what your family needs and what is open. ${BUSINESS.director.name} can tell you what is available.`,
        },
        {
          q: "Is the care the same as for permanent residents?",
          a: `Yes. A respite guest gets the full care: help with the day, medications, meals, and staff awake around the clock. It is not a lesser version.`,
        },
        {
          q: "Can we use it to try Joy before committing?",
          a: `Many families do exactly that. A short stay is the honest way to see whether Joy fits your parent before a longer decision.`,
        },
        {
          q: "How much notice do you need?",
          a: `It depends on openings, which change. Call ${BUSINESS.phone} and ask for ${BUSINESS.director.name.split(" ")[0]}; she can often work with short timelines.`,
        },
      ],
    },
  },
  {
    slug: "daily-activities",
    name: "Daily activities",
    tagline: "Something to get up for, without anyone forcing it.",
    metaTitle: "Daily Activities & Life at Joy Senior Living, Loganville",
    metaDescription:
      "Daily life at Joy Senior Living in Loganville, GA: light exercise, art, games, cooking, and music, adjusted so every resident can take part. Company matters as much as the activity.",
    photo: {
      src: "/images/services/daily-activities.jpg",
      alt: "Residents together during an afternoon activity at Joy Senior Living",
    },
    intro: `A good day has shape. At Joy, mornings might start with gentle stretching, afternoons might hold a card game or a craft, and there is usually music somewhere. Nothing is mandatory. The point is to offer, not to push.`,
    sections: [
      {
        heading: "Mind, body, and company",
        body: [
          `Activities range from light exercise to art, puzzles, trivia, cooking, and sing-alongs. Some keep the body moving, some keep the mind sharp, and most of them are really about sitting with other people and having a good afternoon.`,
        ],
      },
      {
        heading: "For every resident, at every level",
        body: [
          `Activities are adjusted so a resident living with dementia can take part next to a neighbor who does the crossword in pen. Staff help where help is needed, so no one is left sitting on the outside of the room.`,
        ],
      },
    ],
    education: {
      stepsHeading: "A day usually has a shape",
      stepsLede: `Nothing is mandatory. This is just how the hours tend to fall.`,
      steps: [
        {
          label: "Morning",
          body: `Gentle stretching or a walk, coffee and conversation. Nothing anyone is made to do.`,
        },
        {
          label: "Midday",
          body: `Lunch together, then a quiet hour. Some rest, some read, some sit on the porch.`,
        },
        {
          label: "Afternoon",
          body: `A card game, a craft, music, or baking. The activity is really an excuse to be together.`,
        },
        {
          label: "Evening",
          body: `Dinner, then a movie or an early wind-down. The house gets quiet.`,
        },
      ],
      faqsHeading: "Questions families ask",
      faqsLede: `The ones we hear most, answered plainly. Tap any to read more.`,
      faqs: [
        {
          q: "What if my dad won't join in?",
          a: `Then he does not have to. The point is to offer, never to push. Often someone who says no for weeks joins on his own once the room feels familiar.`,
        },
        {
          q: "Can a parent with dementia take part?",
          a: `Yes. Activities are adjusted so a resident living with memory loss can take part next to a neighbor who does the crossword in pen. Staff help where help is needed.`,
        },
        {
          q: "Who leads the activities?",
          a: `Staff lead them, and they know the residents, so an afternoon is built around who is actually in the room that day.`,
        },
        {
          q: "What does a typical week look like?",
          a: `It changes with the season and who is here. ${BUSINESS.director.name} can tell you what this week's activities look like when you visit.`,
        },
      ],
    },
  },
  {
    slug: "nutrition",
    name: "Meals and nutrition",
    tagline: "Handmade meals, cooked here, eaten together.",
    metaTitle: "Meals & Nutrition at Joy Senior Living, Loganville GA",
    metaDescription:
      "Meals at Joy Senior Living in Loganville, GA: handmade in our own kitchen, changing through the week, with all-day snacks and real dietary accommodations, eaten together at a shared table.",
    photo: {
      src: "/images/services/nutrition.jpg",
      alt: "A home-cooked meal at the shared dining table at Joy Senior Living",
    },
    intro: `Meals at Joy are handmade in the kitchen here, not trucked in and reheated. The menu changes through the week for variety, and there are always a few familiar staples for the resident who just wants the thing they like.`,
    sections: [
      {
        heading: "Snacks and dietary needs",
        body: [
          `Popcorn, cookies, and fruit are out during the day, for whenever someone wants them. The kitchen works around real dietary needs, from low salt to soft foods, so a medical restriction never has to mean a joyless plate.`,
        ],
      },
      {
        heading: "The table matters as much as the food",
        body: [
          `Meals are eaten together at a shared table. Sitting down with other people is part of the care, not separate from it, and for many residents it is the best part of the day.`,
        ],
      },
    ],
    education: {
      stepsHeading: "Meals through the day",
      stepsLede: `Cooked here, eaten together, with something on hand between meals.`,
      steps: [
        {
          label: "Breakfast",
          body: `Cooked here in the morning, the way people actually eat it. Coffee however each person takes it.`,
        },
        {
          label: "Lunch",
          body: `A hot midday meal at the shared table, with a familiar staple always on hand.`,
        },
        {
          label: "Snacks",
          body: `Popcorn, cookies, and fruit are out through the day, for whenever someone wants them.`,
        },
        {
          label: "Dinner",
          body: `An early, unhurried dinner together, then the kitchen winds down.`,
        },
      ],
      faqsHeading: "Questions families ask",
      faqsLede: `The ones we hear most, answered plainly. Tap any to read more.`,
      faqs: [
        {
          q: "What about dietary restrictions?",
          a: `The kitchen works around real needs, from low salt to soft foods. A medical restriction never has to mean a joyless plate. Tell ${BUSINESS.director.name} what your parent needs.`,
        },
        {
          q: "What if he is a picky eater?",
          a: `There are always a few familiar staples for the resident who just wants the thing he likes. No one goes hungry over a menu.`,
        },
        {
          q: "Can she eat in her room?",
          a: `The table is where most of the day's company happens, so we gently encourage it. But if a resident needs to eat in her room, that is fine.`,
        },
        {
          q: "Are snacks available between meals?",
          a: `Yes, all day. Popcorn, cookies, and fruit are out, and the kitchen can put something together when someone is hungry off-schedule.`,
        },
      ],
    },
  },
];

/** Service detail pages that are currently visible (memory care is gated). */
export function visibleServiceDetails(): ServiceDetail[] {
  return SERVICE_DETAILS.filter(
    (s) => s.gated !== "memory" || MEMORY_CARE.enabled
  );
}

export function getServiceDetail(slug: string): ServiceDetail | undefined {
  return visibleServiceDetails().find((s) => s.slug === slug);
}
