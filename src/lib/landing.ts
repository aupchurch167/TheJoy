import { TESTIMONIALS } from "./site";

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
  requiresMemoryCare?: boolean;
}[] = [
  { key: "personal", label: "Personal Care", amount: "$4,500", unit: "from, per month" },
  {
    key: "memory",
    label: "Memory Care",
    amount: "$5,500",
    unit: "from, per month",
    requiresMemoryCare: true,
  },
  { key: "respite", label: "Respite", amount: "$250", unit: "up to, per day" },
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
      { item: "24/7 home care", value: "$15–25K/mo" },
      { item: "Groceries, cooking", value: "on you" },
      { item: "Utilities, upkeep, taxes", value: "on you" },
      { item: "Medication management", value: "on you" },
      { item: "Your unpaid 2am shifts", value: "every night" },
    ],
    close: "Two of those you can invoice. The rest you pay in sleep.",
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

/** The resident's own line opens the wall; no marketing sentence beats it. */
const REVIEW_OPENING = {
  quote: "I like my new home.",
  who: "What Mike's father said, unprompted, over coffee in his room.",
};

/**
 * The quote wall = the resident's line, then the real family reviews from the
 * homepage (single source: TESTIMONIALS in site.ts). `align` alternates for
 * rhythm on the page.
 */
export function reviewQuotes(): { quote: string; who: string; align: "start" | "end" }[] {
  const rest = TESTIMONIALS.map((t) => ({
    quote: t.quote,
    who: t.context ? `${t.name}, ${t.context.toLowerCase()}` : t.name,
  }));
  return [REVIEW_OPENING, ...rest].map((q, i) => ({
    ...q,
    align: i % 2 ? "end" : "start",
  }));
}

/** Star ratings shown as chips on /reviews (counts intentionally omitted). */
export const REVIEW_BADGES: { label: string; value: string }[] = [
  { label: "A Place for Mom", value: "Best of Senior Living" },
  { label: "Google", value: "4.9" },
  { label: "Caring.com", value: "5.0" },
];

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
      { q: "How far is the hospital, and who rides with her?", why: "Nobody should go alone." },
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

export type Town = {
  slug: string;
  name: string;
  driveMinutes: number;
  highway: string;
  heroLede: string;
  distanceHeading: string;
  distanceProse: string[];
  distancePull: string;
  anchorHeading: string;
  anchorParas: string[];
  quote?: { quote: string; who: string } | null;
  faqs: { title: string; body: string }[];
};

/**
 * Per-town pages. ANTI-DOORWAY (README): rewrite the sentences per town, not
 * just the nouns. Only towns with real, rewritten copy live here; the rest
 * (grayson, monroe, lawrenceville, gwinnett-county, walton-county) are added
 * once their local-anchor copy is written (hospital / churches / neighborhoods
 * / drive time / highway, and any real local quote).
 */
export const TOWNS: Record<string, Town> = {
  snellville: {
    slug: "snellville",
    name: "Snellville",
    driveMinutes: 12,
    highway: "Highway 20",
    heroLede:
      "Joy is about 12 minutes from downtown Snellville (down Highway 20 toward Loganville).",
    distanceHeading: "What twelve minutes is really worth",
    distanceProse: [
      "It means you can come after work without making a day of it. It means Sunday lunch at the shared table, and being home by two.",
      "And if something changes at nine at night, you are not on an interstate for an hour deciding what you'll find. You are there before the story is over.",
    ],
    distancePull:
      "Distance is the thing families underestimate most, and regret first.",
    anchorHeading: "Families come to us from Snellville for plain reasons.",
    anchorParas: [
      "Most of the calls start the same way: a discharge planner at Piedmont Eastside says he can't go home alone, and there are two days to decide. We take those calls.",
      "Others find us through their church (the congregations along Highway 78), or from a neighbor whose mother lived here and drove in to see her after work.",
    ],
    quote: null,
    faqs: [
      {
        title: "Can I visit whenever I want?",
        body: "Yes. There are no visiting hours, it's her home. Come at breakfast, come at eight at night. If you want to eat with her, tell the kitchen and there's a plate.",
      },
      {
        title: "How do I move a parent out of the house she's lived in for forty years?",
        body: "Slowly, and with her things. Most families bring the chair, the quilt, the photos, and the room stops feeling like a facility by the second week. Mellissa can tell you what to bring first.",
      },
      {
        title: "Do you have an opening right now?",
        body: "With 24 rooms that changes fast. Call (470) 684-3569 and we'll tell you what's open today, and if we're full, what the wait has actually looked like.",
      },
      {
        title: "Do you take residents from outside Loganville?",
        body: "Most of our families live in the surrounding towns and drive in. Being nearby matters more than being in the same zip code.",
      },
    ],
  },
};
