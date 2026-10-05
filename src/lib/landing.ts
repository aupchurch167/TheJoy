/**
 * Content for the conversion landing pages (/cost, /reviews, and the rest as
 * they are built). Kept here (not in components) so the copy and the numbers
 * are editable in one place, per the project rule. Voice (§2) and compliance
 * (§4) apply: no em-dashes (parentheses for asides), no banned words, Joy is a
 * personal care home (never "assisted living" as its own label).
 */

/* ----------------------------- /cost ----------------------------- */

/**
 * Owner-set rates (supplied for the /cost page). Publishing the number is the
 * whole point of the page. The memory-care tier only shows when memory care is
 * offered (MEMORY_CARE.enabled).
 */
export const RATES: {
  key: string;
  label: string;
  amount: string;
  unit: string;
}[] = [
  { key: "personal", label: "Personal Care", amount: "$5,500", unit: "from, per month" },
  { key: "memory", label: "Memory Care", amount: "$6,000", unit: "from, per month" },
  { key: "respite", label: "Respite", amount: "$300", unit: "from, per day" },
];

export const RATES_NOTE =
  "Your exact rate depends on the care your parent needs. Mellissa sets it after meeting them (not before).";

/** The "what the number replaces" ledger: two facing cards. */
export const COST_LEDGER = {
  intro:
    "Nobody compares one rate to nothing. She compares it to what she is already paying, in money and in Tuesdays.",
  home: {
    label: "Staying home",
    rows: [
      { item: "In-home caregiver, 8–10 hours a day", value: "$6–9K/mo" },
      { item: "Groceries, cooking", value: "$400–600/mo" },
      { item: "Utilities, upkeep, taxes", value: "$800–1,200/mo" },
      { item: "Medication management", value: "on you" },
      { item: "The other 14 hours, including 2am", value: "on you" },
    ],
    close:
      "That adds up to $7,200 to $10,800 a month. And the nights are still yours.",
  },
  joy: {
    label: "One rate at Joy",
    rows: [
      { item: "Her room", value: "included" },
      { item: "Three cooked meals, every day, holidays too", value: "included" },
      { item: "Bathing, dressing, medications on time", value: "included" },
      { item: "Housekeeping and laundry", value: "included" },
      { item: "Someone awake all night", value: "included" },
    ],
    close:
      "One number. One check. Nobody to schedule at 6am when an aide calls out.",
  },
};

/**
 * At-home cost calculator (the /cost bridge: our estimates, then hers, then the
 * invitation). Copy and default numbers live here because the rate helper and
 * the "starts at" figures are copy claims, editable in one place.
 *
 * joyFrom mirrors the Personal Care rate in RATES ($5,500). If that rate
 * changes, change it in both places. The rate helper's "$28 to $32 an hour in
 * 2026" is a market claim; update the year and range when it stops being true.
 */
export const COST_CALCULATOR = {
  heading: "Run your own numbers",
  subhead:
    "Every house is different. Put in what you are actually paying, or about to pay, and see where it lands.",
  defaults: {
    paidHours: 8,
    hourlyRate: 29,
    groceries: 500,
    utilities: 300,
    homeCosts: 700,
    other: 0,
  },
  joyFrom: 5500,
  joyLabel: "Personal care",
  helpers: {
    paidHelp: "Drag to what she has now, or zero if you are the one covering it.",
    hourlyRate:
      "Georgia agency rates run $28 to $32 an hour in 2026. Private hires run less, but payroll, backup coverage, and screening are on you.",
    other: "Transportation, yard, alarm monitoring, whatever else the house costs.",
  },
  disclaimer:
    "Your exact rate at Joy depends on the care your parent needs. Mellissa sets it after meeting them, not before.",
};

export const COST_FAQ: { title: string; body: string }[] = [
  {
    title: "What's included in the rate?",
    body: "Her room, three meals cooked here every day, help with bathing and dressing, medications given on time, housekeeping, laundry, and staff awake and on-site all night. Not included: her personal doctor visits, prescriptions themselves, and anything she'd buy for herself anyway.",
  },
  {
    title: "When do rates change?",
    body: "Once a year, and we tell you in writing well before it happens. A rate can also change if your parent's care needs change (Mellissa will talk to you first, not send a new invoice and hope you notice).",
  },
  {
    title: "Does insurance or Medicaid pay for this?",
    body: "Medicare does not pay for personal care homes. Long-term care insurance and VA Aid & Attendance often do, in part. Call and we'll tell you honestly what we've seen work for other families.",
  },
  {
    title: "Is there a deposit?",
    body: "Yes, one month's rate, applied to the first month. There is no community fee, no entrance fee, and no buy-in.",
  },
];

export const COST_VALUE_QUOTE = {
  quote:
    "We were paying more than this for aides who kept changing. The first month here I slept through the night.",
  who: "Karen, daughter of a resident",
};

/* ---------------------------- /reviews --------------------------- */

/**
 * Quote wall for /reviews, in the owner-approved order. Quote text and the
 * odd attributions ("Brison.", "Misty. and Sidney.") are copied from the
 * family reviews. Cuts stay marked with "...". Do not paraphrase.
 * The three quotes after Jacquie were held back by the copy draft; the owner
 * asked for them on the page (Rayna P., Tammy's mom, and the tour line).
 */
export const REVIEW_WALL: { quote: string; who: string }[] = [
  {
    quote: "I like my new home.",
    who: "What Mike's father said, unprompted, over coffee in his room.",
  },
  {
    quote:
      "Walking into The Joy with my dad was like walking into a sanctuary of caring and calm... So grateful for everyone at The Joy!",
    who: "Mike S., resident's son",
  },
  {
    quote: "The staff is friendly... They love the residents like they are family.",
    who: "Misty, whose mom has called The Joy home for nearly 18 months.",
  },
  {
    quote:
      "The caring staff have made my mother feel like she is in her home and loved. They have fostered a family environment and hosted family gatherings. It is truly a 'joy' to have found this facility.",
    who: "Theresa, resident's daughter",
  },
  {
    quote:
      "They have fostered a family environment and hosted family gatherings... Medication is provided as scheduled and they don’t mind you asking about it.",
    who: "Theresa S. and Mark J.",
  },
  {
    quote:
      "We felt welcomed and confident... The staff are warm, attentive, and engaged every time we visit.",
    who: "Kevin McCloskey",
  },
  {
    quote:
      "I have seen a lot of communities and this one by far was the absolute BEST!!! We immediately felt welcomed... we are so happy we moved our mom in here.",
    who: "Sidney, resident's family",
  },
  {
    quote:
      "The delicious aroma of lunch being prepared (which everything is homemade from scratch) instantly made me hungry... That was the icing on the cake.",
    who: "Sidney B.",
  },
  {
    quote:
      "The meals are appetizing and the chef is accommodating to dietary needs... The food is absolutely amazing... great cooks!",
    who: "Misty G. and Rayna P.",
  },
  {
    quote:
      "She enjoys 80% of the food and eats well... They will give her food later if she misses a meal.",
    who: "Shirley P.",
  },
  {
    quote:
      "We found The Joy through Caring.com. What a blessing!! The staff is fabulous and since all the rooms are only steps away from the central \"nurse's station\" they are easily able to keep a vigilant eye on my independent Dad.",
    who: "Cathy, resident's daughter",
  },
  {
    quote:
      "Dad's room is VERY spacious, light, bright, brand new & shining clean! The staff... keep a vigilant eye on my independent Dad.",
    who: "Cathy K.",
  },
  {
    quote:
      "She was in a big community for two years. Lovely lobby. I called three times about her cough before anyone called back. Here, they called me first.",
    who: "Theresa, daughter of a resident",
  },
  {
    quote:
      "They have been available and eager to answer any and all of our questions... We also like that it's a smaller facility. It's not this massive place where my mom might be overlooked.",
    who: "Bethany M.",
  },
  {
    quote:
      "She was beaming, thriving. She evidently has new friends that seem to be right at home too.",
    who: "Brison.",
  },
  {
    quote:
      "We were paying more than this for aides who kept changing. The first month here I slept through the night.",
    who: "Karen, daughter of a resident",
  },
  {
    quote:
      "I had a list on my phone and I asked all of it. Mellissa sat down and went through every one. Nobody else did that.",
    who: "Karen, daughter of a resident",
  },
  {
    quote:
      "We waited eleven months after the first fall. I thought waiting was loyalty. He settled in here in a week, and I got that year back with him (I just wish it had been twelve months longer).",
    who: "Denise, daughter of a resident",
  },
  {
    quote:
      "At the end of the day, their staff was the most engaging and caring. On top of that, it's a brand new building so everything was clean and smelled nice.",
    who: "Nicole, resident's daughter",
  },
  {
    quote:
      "The community is clean, friendly, and always welcoming!... Everything is brand new, and bright, it all gives a positive feeling.",
    who: "Misty. and Sidney.",
  },
  {
    quote:
      "The community plans fun and entertaining activities for the residents and their families.",
    who: "Misty G.",
  },
  {
    quote:
      "The compassion and attention from the entire care staff exceeded our expectations!",
    who: "Diana",
  },
  {
    quote:
      "I have a wonderful friend here and I love going to see her. The staff is amazing! If you're looking for a special place this is it!",
    who: "Jacquie, friend of a resident",
  },
  {
    quote:
      "I love how the staff is extremely engaging with the residents... [The director] is the absolute best. Every time I call her, she is there to assist. The residents love her and I see why!!",
    who: "Rayna P.",
  },
  {
    quote:
      "The Manager... offered her model unit, at no cost... A very peaceful atmosphere is felt right when you walk in.",
    who: "Tammy's mom",
  },
  {
    quote: "I knew right away this was different.",
    who: "People on a tour",
  },
];

/** Family survey answers. The source shows no names. */
export const REVIEW_SURVEY: { quote: string; who: string }[] = [
  {
    quote:
      "My mother is treated very well by the staff at Joy. The staff all know her by name except for new employees.",
    who: "Family survey answer",
  },
  {
    quote: "Mom is happy and feels like she is at home.",
    who: "Family survey answer",
  },
  {
    quote:
      "The level of care and the attention that my Mom receives. When I have visited her, she seems loved and safe.",
    who: "Family survey answer",
  },
  {
    quote: "Things that are going well are the attentiveness to the residents.",
    who: "Family survey answer",
  },
  {
    quote:
      "This is a blessing for my mother. The staff truly cares and is so passionate about what they do. Thank you!",
    who: "Family survey answer",
  },
];

export const REVIEW_INTRO =
  "These are families' own words. Some reviews were long, so we shortened them, and three dots mark each spot where we cut. You can read the full reviews where they were posted:";

export const REVIEW_SURVEY_HEADING = "From our family survey";

/** Portrait on /reviews, matching the approved caption. */
export const REVIEW_MELLISSA_ALT =
  "Mellissa Daniel, Executive Director of The Joy Senior Living";
export const REVIEW_MELLISSA_CAPTION = "She gives every tour herself.";

/**
 * Third-party figures shown as chips on /reviews (September 2026):
 * Google 4.5 from 24 reviews, Caring.com 4.8 from 5 reviews. A Place for Mom's
 * chip stays the Best of Senior Living award (its star rating, 4.9 from 24
 * reviews, was already accurate and is not hardcoded here).
 */
export const REVIEW_BADGES: { label: string; value: string }[] = [
  { label: "A Place for Mom", value: "Best of Senior Living" },
  { label: "Google", value: "4.5 (24 reviews)" },
  { label: "Caring.com", value: "4.8 (5 reviews)" },
];

/** Shown next to the rating chips. Keep in sync with REVIEW_BADGES. */
export const REVIEW_RATINGS_AS_OF = "as of September 2026";

/**
 * Where families can read the reviews in full. TODO(owner): replace with the
 * exact Google / A Place for Mom / Caring.com profile URLs. The Google link is
 * a live search for the business until the real profile URL is pasted in.
 */
export const REVIEW_LINKS: { label: string; href: string }[] = [
  {
    label: "Google reviews",
    href: "https://www.google.com/search?q=Joy+Senior+Living+Loganville+GA+reviews",
  },
  { label: "A Place for Mom profile", href: "https://www.aplaceformom.com/" },
  { label: "Caring.com profile", href: "https://www.caring.com/" },
];

/* ------------------------- /when-its-time ------------------------ */

export const WHEN_TUESDAY: string[] = [
  "It was a Tuesday. The mail on his counter was still in its rubber band. He told you about the neighbor's truck twice in ten minutes, the same words both times.",
  "And when he came down the stairs, his hand was on the rail in a way it never used to be. You drove home and didn't turn the radio on.",
];

export const WHEN_SIGNS_LEDE =
  "None of these mean it's time by itself. Together, they usually mean the days have gotten longer than one person can hold.";

export const WHEN_SIGNS: { heading: string; body: string }[] = [
  {
    heading: "The mail stops getting opened.",
    body: "What it means: the ordinary sequence of a day (open it, decide, act) has gotten heavy. Bills are usually the first thing to go.",
  },
  {
    heading: "The same story, twice in ten minutes.",
    body: "What it means: short-term memory is thinning. He isn't repeating himself to you (for him, he hasn't said it yet).",
  },
  {
    heading: "A new grip on the stair rail.",
    body: "What it means: he's compensating, and he knows it before you do. Most families call us within a year of the first fall. Most wish they'd called before it.",
  },
  {
    heading: "The fridge has food, but he isn't eating it.",
    body: "What it means: cooking for one is a chore even when you're well. Weight loss shows up quietly, in a belt notch.",
  },
  {
    heading: "The pills are in the right box, on the wrong day.",
    body: "What it means: the system he built is now the thing that needs managing. This is the sign that most often becomes an ER visit.",
  },
  {
    heading: "You check your phone at 2am to see if he called.",
    body: "What it means: this one is about you, and it counts. You are already doing the night shift, without the sleep or the training.",
  },
];

export const WHEN_TURN = {
  heading: "Noticing isn't betrayal.",
  paras: [
    "You are not giving up on him. You are running out of hours, which is a different thing entirely, and it happens to everyone who does this well.",
    "Here is what getting help actually buys: you stop being the one who counts pills and argues about showers. Someone else does that. You go back to being his daughter (the one who brings the crossword and sits on the porch and hears the truck story a third time without flinching).",
  ],
  pull: "Help is how you stay his daughter instead of becoming his nurse.",
};

/* NOTE(owner): confirm this is a real family's words before launch (§ do not
   fabricate quotes). Remove or replace if it is not verbatim. */
export const WHEN_QUOTE = {
  quote:
    "We waited eleven months after the first fall. I thought waiting was loyalty. He settled in here in a week, and I got that year back with him (I just wish it had been twelve months longer).",
  who: "Denise, daughter of a resident",
};

export const WHEN_FAQ: { title: string; body: string }[] = [
  {
    title: "How do I even bring this up with him?",
    body: 'Not as a decision. As a visit. "Dad, I want to go look at a place near me, and I want your opinion on it." Most of the fight is about being told, not about moving. Mellissa has sat at a lot of those kitchen tables and can tell you what usually works.',
  },
  {
    title: "What if he refuses?",
    body: "Then he refuses, for now, and you keep the door open. Come tour without him first so you know what you're describing. A lot of parents say no to the idea and yes to the actual house (it's a home on a residential road with 24 people in it, not what he's picturing).",
  },
  {
    title: "Is it too soon?",
    body: "Coming to look is never too soon. Moving is too soon if he's safe, eating, taking his medications, and not alone at night. If you can't say all four out loud, it isn't too soon.",
  },
  {
    title: "What if I'm wrong about all of this?",
    body: "Then you'll have spent an hour in a house on Conyers Rd and learned something. We will also tell you honestly if Joy isn't the right level of care for him (that's part of the job).",
  },
];

/* ---------------------- /small-home-difference ------------------- */

export const SMALL_TUESDAY: string[] = [
  "You toured the 120-bed building on a Tuesday. Marble lobby, a fountain, a woman in a blazer with your name already printed on a folder.",
  "She was warm and she was good at this. You drove home with the folder on the passenger seat and couldn't say what was wrong, only that you didn't want to leave your mother there.",
];

export const SMALL_INTRO = {
  heading: "It isn't better and worse. It's arithmetic.",
  body: "Twenty-four residents, or a hundred and twenty. Everything else follows from that one number.",
};

export const SMALL_CONTRASTS: { heading: string; body: string }[] = [
  {
    heading: "Who notices she stopped finishing lunch",
    body: "In a big building, a chart notices (eventually, at a care conference). Here, the woman who cooked it notices at one o'clock, because she also cooked yesterday's.",
  },
  {
    heading: "Who knows how she takes her coffee",
    body: "Not a preference in a system. A person who has poured it ninety times. On a rotating floor of forty, nobody gets ninety chances.",
  },
  {
    heading: "What the hallway smells like at noon",
    body: "A kitchen you can smell, or a cafeteria with a steam line and a tray cart. One of those tells a person with dementia that it's lunchtime without anyone saying so.",
  },
  {
    heading: "How many strangers she meets in a month",
    body: "Large staffs run on shifts and agency fill-ins. For a mind that's thinning, a new face is work. Familiarity isn't a nicety (it's most of the treatment).",
  },
];

export const SMALL_PULL = "A chandelier never checked on anyone at 3am.";

/* NOTE(owner): confirm this is a real family's words before launch. */
export const SMALL_QUOTE = {
  quote:
    "She was in a big community for two years. Lovely lobby. I called three times about her cough before anyone called back. Here, they called me first.",
  who: "Theresa, daughter of a resident",
};

export const SMALL_FAQ: { title: string; body: string }[] = [
  {
    title: "Isn't a small home less capable?",
    body: "Small is not the same as less. Staff are awake around the clock, medications are managed by people who know each resident, and help is on hand every hour. What a large building adds isn't more care (it's more residents per aide).",
  },
  {
    title: "What about real medical needs?",
    body: "We coordinate with doctors, home health, and hospice inside the home. What we can't do: skilled nursing (ventilators, IV care, two-person transfers, wound care only a nurse can do). If your parent needs that, we'll say so and help you find the right place.",
  },
  {
    title: "What does a Georgia personal care home license mean?",
    body: "It's a distinct license the state grants, with its own staffing, medication, and inspection rules, and it's inspected. It is not a nursing home license, and it isn't a lesser version of assisted living (it's the license that allows a home this size to operate as a home).",
  },
  {
    title: "Is memory care different here?",
    body: "It's inside the same house, with the same small scale and the same faces, which matters more for memory loss than almost anything else. Routine does most of the work.",
  },
];

/* ------------------------ /tour-checklist ------------------------ */

export const CHECKLIST_GROUPS: {
  name: string;
  items: { q: string; why: string }[];
}[] = [
  {
    name: "Care & Staffing",
    items: [
      { q: "How many residents live here, and how many staff are on right now?", why: "Ask for today's number, not the brochure's." },
      { q: "Who is awake overnight, and are they awake or on call?", why: "There is a difference, and it matters at 3am." },
      { q: "How long has the longest-serving caregiver been here?", why: "Turnover is the single best predictor of care." },
      { q: "Who gives medications, and what happens if a dose is missed?", why: "Ask to see the log." },
      { q: "Will the same people care for my parent most days?", why: "Familiar faces do more than any program." },
      { q: "Who do I call at night with a question, and who actually answers?", why: "A name is a better answer than a number." },
    ],
  },
  {
    name: "Daily Life",
    items: [
      { q: "Who cooks the food, and where?", why: "Ask to see the kitchen. Ask what's for dinner." },
      { q: "Can I eat a meal here before we decide?", why: "A yes tells you a lot." },
      { q: "What happens if my mother doesn't want to join an activity?", why: 'Listen for "we offer," not "we require."' },
      { q: "What time does she have to get up?", why: "In a good home, mostly when she wants." },
      { q: "Can she bring her own furniture, her chair, her quilt?", why: "Rooms should look like people, not units." },
      { q: "How do you know how she takes her coffee?", why: "An odd question that separates every place you'll tour." },
      { q: "What do the afternoons actually sound like?", why: "Then stop talking and listen for yourself." },
    ],
  },
  {
    name: "Safety",
    items: [
      { q: "What is your license, and can I see the state's last inspection?", why: "Public record. A good home hands it over." },
      { q: "What do you do after a fall, that day and the week after?", why: "Ask about the last one." },
      { q: "If she has to go to the hospital, how does that work and who goes with her?", why: "Ask what the home does, and what falls to family." },
      { q: "What can't you handle here?", why: "Every honest home has a list." },
      { q: "How do you handle wandering, if that starts?", why: "Ask specifically, not generally." },
    ],
  },
  {
    name: "Money",
    items: [
      { q: "What is the monthly rate, and what is not included?", why: "Get the second half in writing." },
      { q: "How often do rates rise, and by how much, historically?", why: "Ask for the last three years." },
      { q: "What happens if her care needs increase?", why: "Ask whether the price or the plan changes first." },
      { q: "Is there a deposit, community fee, or entrance fee?", why: "Ask which ones are refundable." },
      { q: "What if she runs out of money in four years?", why: "Ask what has happened to other families here." },
    ],
  },
  {
    name: "Gut Checks",
    items: [
      { q: "What does it smell like when you first walk in?", why: "Trust this one." },
      { q: "Do the residents look at you, or past you?", why: "You'll know within a minute." },
    ],
  },
];

export const CHECKLIST_STATEMENT = {
  heading: "Bring all 25 to Joy. We like the hard ones.",
  body: "Ask about staff turnover. Ask what happens at 3am. Ask what we can't do (we'll tell you, and we'll tell you where to look instead). A place that flinches at question 19 is answering it.",
};

/* NOTE(owner): confirm this is a real family's words before launch. */
export const CHECKLIST_QUOTE = {
  quote:
    "I had a list on my phone and I asked all of it. Mellissa sat down and went through every one. Nobody else did that.",
  who: "Karen, daughter of a resident",
};

/* -------------------------- /serving/* --------------------------- */

/**
 * Loganville is the home city, not a drive-from town. Its page is
 * `src/app/(site)/serving/loganville/page.tsx` (its own copy, not this
 * template). Listed with the areas we serve and in the sitemap.
 */
export const LOGANVILLE_SERVING = {
  slug: "loganville",
  name: "Loganville",
} as const;

export type TownSection = {
  heading: string;
  paragraphs: string[];
  pull?: string;
};

export type TownCta = {
  headline: string;
  /** Line under the tour button. Empty omits it. */
  note?: string;
  phoneLead?: string;
};

export type Town = {
  slug: string;
  name: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  lede: string;
  driveMinutes: number;
  /**
   * Road name in the route graphic. Empty string means the graphic shows the
   * drive time and no road (Dacula).
   */
  highway: string;
  openingCta: TownCta;
  closingCta: TownCta;
  /** Sits beside the route graphic. */
  lead: TownSection;
  sections: TownSection[];
  faqsHeading: string;
  faqs: { title: string; body: string }[];
  mellissaCaption: string;
  /** The county hub this town links up to (a key of COUNTIES). */
  county: CountySlug;
};

export const TOWN_MELLISSA = {
  src: "https://pub-6e43e90472054fe3880f53e8c0ca3b60.r2.dev/blog/mellissa-541839.jpg",
  alt: "Mellissa Daniel, Executive Director of The Joy Senior Living",
};

/**
 * Town pages. Copy is owner-approved and unique per town. Snellville's road is
 * US 78 (not Highway 20). Dacula's route graphic names no road.
 */
export const TOWNS: Record<string, Town> = {
  snellville: {
    slug: "snellville",
    name: "Snellville",
    title: "Personal Care Home Near Snellville, GA | The Joy",
    description:
      "The Joy is a 24-suite personal care home with memory care, about 12 minutes from Snellville. Visit any time. Call Mellissa at (470) 684-3569.",
    eyebrow: "For Snellville families",
    h1: "Twelve minutes from Snellville, close enough to stop by after work.",
    lede: "The Joy is a 24-suite personal care home with memory care in Loganville. From Snellville it's about 12 minutes east on US 78.",
    driveMinutes: 12,
    highway: "US 78",
    openingCta: {
      headline: "Come see the house. There's nothing to sign.",
      note: "",
      phoneLead: "Or call Mellissa at",
    },
    closingCta: {
      headline: "Twelve minutes from Snellville. Come look around.",
      note: "A tour is just a walk through the house and your questions answered.",
      phoneLead: "Call Mellissa:",
    },
    lead: {
      heading: "What 12 minutes buys you",
      paragraphs: [
        "Twelve minutes is short enough to stop on the way home from work. You don't have to change clothes or plan around it. You can sit with your dad for half an hour and still make your own dinner.",
        "A lot of the guilt in this decision comes from picturing him alone. Being close won't erase that. It does mean that when the worry starts, you can get in the car and go see for yourself.",
      ],
      pull: "The visit you can make on the way home is the one that actually happens.",
    },
    sections: [
      {
        heading: "What the monthly rate covers",
        paragraphs: [
          "The monthly rate includes all of his care, his meals and help with daily living. Rates change, so call us for the current number. We'd rather give you a real figure for your dad than a range that doesn't fit him.",
        ],
      },
    ],
    faqsHeading: "What Snellville families ask us",
    faqs: [
      {
        title: "Can I visit whenever I want?",
        body: "Yes. There are no visiting hours. It's his home now. If you'd like to eat with him, tell the kitchen ahead of time and they'll set a plate for you.",
      },
      {
        title: "How do I move him out of a house he's lived in for forty years?",
        body: "Slowly, and with his own things. Bring his recliner and the photos off his dresser. Familiar things help a new room feel like his. Mellissa can tell you what to bring first and what can wait.",
      },
      {
        title: "Do you only take people from Loganville?",
        body: "No. Most of our families live in the towns around Loganville and drive in. What matters is that you can get here easily, and from Snellville you can.",
      },
    ],
    mellissaCaption: "She'll be the one who shows you around.",
    county: "gwinnett-county",
  },

  grayson: {
    slug: "grayson",
    name: "Grayson",
    title: "10 Minutes from Grayson: Personal & Memory Care | The Joy",
    description:
      "A 24-suite personal care home with memory care, 10 minutes down Highway 20 from Grayson. Small enough that the staff know your mom by name.",
    eyebrow: "Grayson, Georgia",
    h1: "Ten minutes down Highway 20 from Grayson.",
    lede: "The Joy is on Conyers Road in Loganville, about ten minutes from Grayson by Highway 20. It's a licensed personal care home with memory care and 24 suites.",
    driveMinutes: 10,
    highway: "Highway 20",
    openingCta: {
      headline: "Walk through the house with Mellissa. Ask her anything.",
      note: "",
      phoneLead: "Or call",
    },
    closingCta: {
      headline: "Ten minutes from Grayson. Come see it.",
      note: "Bring your questions. We'll answer every one.",
      phoneLead: "Or phone us at",
    },
    lead: {
      heading: "Close enough to stop planning visits",
      paragraphs: [
        "When your mom is ten minutes away, you stop putting visits on the calendar. You swing by on a Wednesday because you were out anyway. You bring the grandkids on Saturday with a bag of peaches.",
        "Families who chose a place an hour away tell us the same thing. They meant to go more, and the drive kept winning. From Grayson, the drive doesn't get much of a say.",
      ],
      pull: "Ten minutes is a visit. An hour is a trip you keep putting off.",
    },
    sections: [
      {
        heading: "How small is small?",
        paragraphs: [
          "Twenty-four suites in one house. That's the whole place. Everyone eats at the same table, and the same team sees your mom every day.",
          "Small matters most when something changes. The people who see her every day notice when she skips breakfast or seems off in the afternoon. They tell Mellissa that day.",
        ],
      },
    ],
    faqsHeading: "Grayson families usually want to know",
    faqs: [
      {
        title: "Do you have a room open right now?",
        body: "Maybe. With 24 suites, that can change from one week to the next. Call (470) 684-3569 and we'll tell you what's open today. If we're full, we'll tell you how long the wait has really been.",
      },
      {
        title: "Will she eat well?",
        body: "Meals are cooked here in the house, and families bring up the food more than almost anything else. If she has a diet she needs to follow, tell us on your tour.",
      },
      {
        title: "I'm not ready to decide. Can I still come look?",
        body: "Yes. A tour doesn't commit you to anything. Come see the house, then go home and think about it.",
      },
    ],
    mellissaCaption: "She runs the house herself.",
    county: "gwinnett-county",
  },

  monroe: {
    slug: "monroe",
    name: "Monroe",
    title: "Walton County Personal Care Home Near Monroe | The Joy",
    description:
      "The Joy is a licensed personal care home with memory care in Loganville, about 15 minutes from Monroe on Highway 78. Call (470) 684-3569.",
    eyebrow: "Walton County",
    h1: "A personal care home in Walton County, 15 minutes from Monroe.",
    lede: "Monroe is the Walton County seat. The Joy is in Loganville, on the west side of the same county, about 15 minutes away on Highway 78.",
    driveMinutes: 15,
    highway: "Highway 78",
    openingCta: {
      headline: "See it in person. Mellissa will likely be the one who greets you.",
      note: "",
      phoneLead: "Or call",
    },
    closingCta: {
      headline: "Fifteen minutes from Monroe, in the same county. Visit when you can.",
      note: "Come for a tour. You won't be asked to sign anything.",
      phoneLead: "Questions first? Call",
    },
    lead: {
      heading: "Staying in the county she knows",
      paragraphs: [
        "Your mother has probably driven Highway 78 more times than anyone could count. Needing more help doesn't have to mean leaving the county. Her church friends and her neighbors can still come see her.",
        "It keeps you close, too. If she has a hard night, you're about fifteen minutes away.",
      ],
    },
    sections: [
      {
        heading: "If she's at Piedmont Walton right now",
        paragraphs: [
          "A lot of hard decisions start in a hospital room. Someone tells you your mom can't go back home alone, and suddenly you have a weekend to figure out what comes next.",
          "If that's where you are, call us from the hospital. Someone here at the house will pick up. We'll tell you what's open and what a move would look like.",
        ],
      },
      {
        heading: "What the license means",
        paragraphs: [
          "The State of Georgia licenses The Joy as a personal care home. That license shapes what we do: help with daily living, medications and meals, in a home small enough to stay personal. There are also things a personal care home isn't set up for. Ask us where that line is for your mom, and we'll tell you straight.",
          "The Joy has been in compliance at every state inspection.",
        ],
      },
    ],
    faqsHeading: "Questions from Monroe families",
    faqs: [
      {
        title: "How far is The Joy from downtown Monroe?",
        body: "Roughly fifteen minutes. Head west on Highway 78 into Loganville, then a short way down Conyers Road.",
      },
      {
        title: "Who gives her medications?",
        body: "A certified medication aide is on staff 24 hours a day, overnight included. Every shift ends and starts with a count of her medications, so there's a check at every handoff.",
      },
      {
        title: "Can our family still get together with her there?",
        body: "Yes. The home has hosted family gatherings, and families visit all the time. Tell Mellissa what you have in mind.",
      },
    ],
    mellissaCaption: "She leads the home here in Loganville.",
    county: "walton-county",
  },

  lawrenceville: {
    slug: "lawrenceville",
    name: "Lawrenceville",
    title: "Small Personal Care Home Near Lawrenceville, GA | The Joy",
    description:
      "Twenty minutes down Highway 20 from Lawrenceville, The Joy is a 24-suite personal care home with memory care. Worth the drive if you want small.",
    eyebrow: "From Lawrenceville",
    h1: "Twenty minutes from Lawrenceville, and small on purpose.",
    lede: "You can find big senior buildings closer to Lawrenceville. The Joy is 24 suites in one house in Loganville, about twenty minutes south on Highway 20 through Grayson.",
    driveMinutes: 20,
    highway: "Highway 20 through Grayson",
    openingCta: {
      headline: "Make the drive once and decide if it's worth it.",
      note: "",
      phoneLead: "Or call Mellissa at",
    },
    closingCta: {
      headline: "Twenty minutes from Lawrenceville. See if small is right for her.",
      note: "No sales pitch. Just a walk through the house.",
      phoneLead: "Or call",
    },
    lead: {
      heading: "Why some families drive past the big places",
      paragraphs: [
        "Large buildings have long hallways and a lot of residents. Some families like that. Others walk through and come away worried that Mom will be one more door on a long hall.",
        "Those families tend to keep looking for something smaller. With 24 suites, the people who help your mom every day can learn her whole story. One person runs the house, and her name is Mellissa.",
      ],
      pull: "Big is easy to find. Small enough to know her by name is worth a short drive.",
    },
    sections: [
      {
        heading: "Who's here, and when",
        paragraphs: [
          "A certified medication aide is on staff 24 hours a day, including overnight. A nurse is on site 24 hours a week, spread across three days. A nurse isn't here overnight. We'd rather you read that here than find out later.",
          "Medications are counted at the end of every shift and again at the start of the next one. It's a double check at every shift change.",
        ],
      },
    ],
    faqsHeading: "Before you make the drive",
    faqs: [
      {
        title: "Why drive twenty minutes when there are places in Lawrenceville?",
        body: "Because you want small. If a large building suits your mom, you'll find good options closer to home. If you want her somewhere everyone knows her, the drive is worth it. Plenty of our Gwinnett families visit on weeknights and are home before bed.",
      },
      {
        title: "What should I ask when I tour?",
        body: "Ask who's awake overnight and who gives medications. Ask how long the staff have been here. Ask Mellissa what happens when a resident's needs change. Then ask every other home you visit the same questions and compare.",
      },
    ],
    mellissaCaption: "You'll meet her on your tour.",
    county: "gwinnett-county",
  },

  dacula: {
    slug: "dacula",
    name: "Dacula",
    title: "Personal Care & Memory Care Near Dacula, GA | The Joy",
    description:
      "Caring for a parent at home near Dacula? The Joy is a small personal care home with memory care 15 minutes away, with a free caregiver support group.",
    eyebrow: "Near Dacula",
    h1: "For Dacula families still caring for a parent at home.",
    lede: "Maybe your mom lives with you now. Maybe you drive over every morning before work to check on her. The Joy is about fifteen minutes from Dacula, and you don't have to be ready to move her to call us.",
    driveMinutes: 15,
    highway: "",
    openingCta: {
      headline: "Call and talk it through. You don't have to be ready.",
      note: "",
      phoneLead: "Mellissa's number is",
    },
    closingCta: {
      headline: "Fifteen minutes from Dacula. Come when you're ready.",
      note: "A tour or the support group. Either one is a good first step.",
      phoneLead: "Or call",
    },
    lead: {
      heading: "A support group, before you need anything else",
      paragraphs: [
        "A caregiver support group meets here at The Joy on the third Thursday of every month at 2pm. It's free. Call (470) 684-3569 or email hello@joyseniorcare.com for details, then come once and see if it helps.",
      ],
    },
    sections: [
      {
        heading: "When home stops feeling safe",
        paragraphs: [
          "Most families know before they say it out loud. Something happens, a fall or a bad night, and the worry doesn't go away afterward.",
          "When you get there, call us. We answer the phone ourselves. We'll talk through where your mom is and whether The Joy is a good fit for her. If it isn't, we'll say so.",
        ],
        pull: "The distance you pick now is the one you'll drive on the hard nights.",
      },
      {
        heading: "One house, fifteen minutes away",
        paragraphs: [
          "The Joy is one house with 24 suites and memory care, led by Mellissa Daniel. Once your mom moves in, you can come by after dinner and still be home at a decent hour.",
        ],
      },
    ],
    faqsHeading: "Questions from Dacula",
    faqs: [
      {
        title: "How long is the drive from Dacula, really?",
        body: "About fifteen minutes. It depends on traffic and which side of Dacula you're starting from.",
      },
      {
        title: "What makes The Joy different from the larger places near Dacula?",
        body: "Size. The Joy has 24 suites in one house. The same staff see the same residents every day and learn their habits. Nobody gets lost in a crowd, because there isn't one.",
      },
      {
        title: "Can we just talk before we tour?",
        body: "Yes. Call (470) 684-3569 or email hello@joyseniorcare.com. A first call can be nothing but questions.",
      },
    ],
    mellissaCaption: "Families call her when they aren't sure it's time.",
    county: "gwinnett-county",
  },
};

/* ----------------------- /serving/<county> ------------------------ */

export type CountySlug = "gwinnett-county" | "walton-county";

export type CountySection = TownSection & {
  /** Optional link line under the paragraphs. */
  link?: { href: string; label: string };
};

export type County = {
  slug: CountySlug;
  /** "Gwinnett County" */
  name: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  lede: string;
  openingCta: TownCta;
  closingCta: TownCta;
  sections: CountySection[];
  /** The spoke pages under this hub. */
  townsHeading: string;
  towns: { href: string; name: string; line: string }[];
  faqsHeading: string;
  faqs: { title: string; body: string }[];
  mellissaCaption: string;
};

/** Published rates. Keep in agreement with RATES (the /cost rate card). */
const COUNTY_COST: CountySection = {
  heading: "What it costs",
  paragraphs: [
    "We publish our prices. Personal care starts at $5,500 a month, and memory care starts at $6,000. Mellissa sets the exact rate after she meets your parent, because it depends on the care they need.",
    "The rate covers the suite, three cooked meals a day, help with bathing, dressing and medications, housekeeping and laundry, and someone awake all night. One number, one check.",
  ],
  link: { href: "/cost", label: "See what the rate covers and what it replaces" },
};

/**
 * County hubs above the town pages. Drive times are the ones already published
 * on the town pages (TOWNS) and hospital times are the ones on /partners. Do
 * not add a time that is not published there first.
 */
export const COUNTIES: Record<CountySlug, County> = {
  "gwinnett-county": {
    slug: "gwinnett-county",
    name: "Gwinnett County",
    title: "Senior Living & Personal Care in Gwinnett County, GA | The Joy",
    description:
      "A 24-suite personal care home with memory care on the southeast edge of Gwinnett County, about ten minutes from Grayson and twelve from Snellville.",
    eyebrow: "Gwinnett County",
    h1: "A small home on the southeast edge of Gwinnett County.",
    lede: "The Joy is a licensed personal care home with memory care in Loganville, right where Gwinnett meets Walton County. It's about ten minutes from Grayson and twelve from Snellville. There are 24 suites, and Mellissa Daniel runs the house.",
    openingCta: {
      headline: "Come see the house. Mellissa will walk you through it.",
      note: "",
      phoneLead: "Or call",
    },
    closingCta: {
      headline: "On the Gwinnett line, and small on purpose. Come look around.",
      note: "A tour is a walk through the house and your questions answered.",
      phoneLead: "Questions first? Call",
    },
    sections: [
      {
        heading: "What a Gwinnett search turns up",
        paragraphs: [
          "Search for assisted living in Gwinnett County and the list is long. You'll find big senior buildings all over the county, with long hallways and a dining room that seats a crowd. Some families tour one and feel right at home. If that suits your mom, it's a fine choice.",
          "Other families walk out worried. They picture Dad as one more door on a long hall. Those families tend to keep looking for something smaller.",
          "In Georgia, smaller often means a licensed personal care home. That's what The Joy is. One house with 24 suites. Everyone eats at the same table, and the same team sees your dad every day. They learn his whole story, and they notice when something is off.",
          "Memory care is part of the license, throughout the home. The whole house is secured. There isn't a separate wing your dad gets moved into later. If his memory changes, he stays in the house he already knows, with people who already know him.",
        ],
        pull: "Big is easy to find. Small takes a little more looking.",
      },
      {
        heading: "Where we are, from four Gwinnett towns",
        paragraphs: [
          "The Joy is on Conyers Road in Loganville. That's Walton County, right on the Gwinnett line. For a lot of Gwinnett families, it's closer than it sounds.",
          "From Grayson it's about ten minutes down Highway 20. From Snellville it's about twelve minutes east on US 78. From Dacula it's about fifteen minutes. From Lawrenceville it's about twenty, south on Highway 20 through Grayson.",
          "Close matters more than people expect. When your mom is fifteen minutes away, you stop putting visits on the calendar. You stop by after work because you can.",
        ],
      },
      {
        heading: "If your dad is at Piedmont Eastside or Northside Gwinnett",
        paragraphs: [
          "A lot of these decisions start in a hospital room. A doctor says your dad can't go home alone, and the discharge planner wants a plan by Friday.",
          "Call us from the hospital. Piedmont Eastside is about twenty minutes from the house, and Northside Gwinnett is about thirty. When we can, Mellissa does the assessment the same day, and she can come to his bedside. Then she'll tell you plainly whether The Joy fits what he needs.",
          "If you're not ready to decide on a permanent move, ask about respite. A respite stay runs from a few days to a few weeks, with the same care every resident gets. Some families use it as the bridge home from the hospital. Others use it to see whether The Joy fits before they decide anything.",
          "Hospice and home health are welcome in the house, so a new need doesn't automatically mean a new move.",
        ],
      },
      {
        heading: "If you're still caring for a parent at home",
        paragraphs: [
          "Not every Gwinnett family is ready to talk about a move. Some are doing the caregiving themselves, every day, and it's wearing thin.",
          "A caregiver support group meets at The Joy on the third Thursday of every month at 2pm. It's free. You don't need a parent living with us, and you don't need to be thinking about a move. Come once and see if it helps.",
        ],
        link: { href: "/blog/dementia-caregiver-support-group", label: "What the support group is like" },
      },
      COUNTY_COST,
    ],
    townsHeading: "Gwinnett towns near The Joy",
    towns: [
      { href: "/serving/grayson", name: "Grayson", line: "About ten minutes down Highway 20." },
      { href: "/serving/snellville", name: "Snellville", line: "About twelve minutes east on US 78." },
      { href: "/serving/dacula", name: "Dacula", line: "About fifteen minutes, with a free caregiver support group every month." },
      { href: "/serving/lawrenceville", name: "Lawrenceville", line: "About twenty minutes, for families who want small." },
    ],
    faqsHeading: "What Gwinnett families ask us",
    faqs: [
      {
        title: "Are there small personal care homes in Gwinnett County?",
        body: "The Joy is just over the county line in Loganville, on the southeast edge of Gwinnett. It has 24 suites in one house. Wherever you look, ask each home for its license type and number. Georgia's inspection reports are public, and ours are linked from our About page.",
      },
      {
        title: "How is a personal care home different from the big places in Gwinnett?",
        body: "Mostly size. The Joy has 24 suites in one house, and the same caregivers see the same residents every day. A certified medication aide is on staff 24 hours a day, overnight included, and medications are counted at every shift change. A nurse is on site 24 hours a week, spread across three days. A nurse isn't here overnight, and we'd rather you hear that from us.",
      },
      {
        title: "Which Gwinnett cities are you closest to?",
        body: "Grayson is about ten minutes away. Snellville is about twelve, Dacula about fifteen, and Lawrenceville about twenty.",
      },
      {
        title: "Can you take someone straight from a Gwinnett hospital?",
        body: "Often, yes, if a suite is open and The Joy fits what your parent needs. Call from the hospital. Mellissa does a same-day assessment when she can, at the bedside if that helps, and the move can often happen the next day. If we're not the right fit, she'll say so.",
      },
    ],
    mellissaCaption: "She'll be the one who shows you around.",
  },

  "walton-county": {
    slug: "walton-county",
    name: "Walton County",
    title: "Senior Living & Personal Care in Walton County, GA | The Joy",
    description:
      "A 24-suite personal care home with memory care in Loganville, on the Walton side of the Gwinnett line. About 15 minutes from Monroe and Piedmont Walton.",
    eyebrow: "Walton County",
    h1: "A small personal care home in Walton County.",
    lede: "The Joy is in Loganville, right where Walton County meets Gwinnett. It's a licensed personal care home with memory care and 24 suites, about fifteen minutes from Monroe. Mellissa Daniel runs the house.",
    openingCta: {
      headline: "See it in person. Mellissa will likely be the one who greets you.",
      note: "",
      phoneLead: "Or call",
    },
    closingCta: {
      headline: "In the county she knows. Visit when you can.",
      note: "Come for a tour. You won't be asked to sign anything.",
      phoneLead: "Or call",
    },
    sections: [
      {
        heading: "Staying in the county",
        paragraphs: [
          "Loganville sits on the line between two counties. The Joy is on the Walton side, on Conyers Road.",
          "If your mom has spent her life in Monroe, Social Circle, Between, Good Hope or Walnut Grove, she doesn't have to leave the county to get more help. Her church friends can still come by. So can her neighbors and the grandkids.",
          "We're one house with 24 suites. Everyone eats at the same table. Staff know who needs the long walk after lunch and who needs quiet when the afternoon gets hard.",
          "If you're caring for a parent at home and not ready for any of this, that's fine too. A free caregiver support group meets here on the third Thursday of every month at 2pm. Walton families are welcome, whether or not a move is ever on the table.",
        ],
        pull: "Needing more help doesn't have to mean leaving the county.",
      },
      {
        heading: "Fifteen minutes from Monroe, and from Piedmont Walton",
        paragraphs: [
          "From downtown Monroe it's about fifteen minutes west on Highway 78. Piedmont Walton is about fifteen minutes from the house, too.",
          "A lot of hard decisions start in a hospital room. Someone tells you your mom can't go back home alone, and you have a weekend to figure out what comes next. If that's where you are, call us from the hospital. When we can, Mellissa will assess her the same day, and she can come to the bedside. We'll tell you what's open and what a move would look like.",
          "If it's too soon to decide, a respite stay can bridge the gap. It runs from a few days to a few weeks, with the same care every resident gets.",
        ],
      },
      {
        heading: "What to check anywhere you tour",
        paragraphs: [
          "Whether you tour one place or five, ask each of them the same questions.",
          "Ask for the license type and number. Georgia's Department of Community Health inspects personal care homes, and the reports are public. Read the recent ones. Ours are linked from our About page.",
          "Ask who's awake at night and who gives medications. At The Joy, a certified medication aide is on staff 24 hours a day, overnight included. A nurse is on site 24 hours a week across three days, and not overnight.",
          "Ask what happens when a resident's needs change. A good home will tell you where its line is. So will we.",
        ],
        link: { href: "/tour-checklist", label: "Print our 25-question tour checklist" },
      },
      COUNTY_COST,
    ],
    townsHeading: "More for Walton County families",
    towns: [
      { href: "/serving/monroe", name: "Monroe", line: "About fifteen minutes on Highway 78, in the same county." },
      { href: "/serving/loganville", name: "Loganville", line: "Our home town. What a licensed personal care home is, and who it fits." },
    ],
    faqsHeading: "Questions from Walton County families",
    faqs: [
      {
        title: "Is The Joy in Walton County?",
        body: "Yes. The Joy is at 434 Conyers Rd in Loganville, on the Walton side of the Gwinnett line.",
      },
      {
        title: "How far is The Joy from Monroe?",
        body: "About fifteen minutes. Head west on Highway 78 into Loganville, then a short way down Conyers Road.",
      },
      {
        title: "Do you have memory care?",
        body: "Yes. The Joy is licensed for memory care throughout the home, and the whole home is secured. If her memory changes, she stays in the house she already knows, with people who already know her.",
      },
      {
        title: "Can she come straight from Piedmont Walton?",
        body: "Often, yes, if a suite is open and The Joy fits what she needs. Call from the hospital. Mellissa does a same-day assessment when she can, at the bedside if that helps. If we're not the right fit, she'll tell you.",
      },
    ],
    mellissaCaption: "She leads the home here in Loganville.",
  },
};
