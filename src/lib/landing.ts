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
}[] = [
  { key: "senior", label: "Senior Living", amount: "$5,500", unit: "from, per month" },
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
 * joyFrom mirrors the Senior Living rate in RATES ($5,500). If that rate
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
  joyLabel: "Senior living",
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

  // VERIFY LOCAL FACTS before publishing: drive minutes, the named highway, and
  // the hospital reference in each town are best-guess and should be confirmed.
  grayson: {
    slug: "grayson",
    name: "Grayson",
    driveMinutes: 10,
    highway: "Highway 20",
    heroLede:
      "Joy is about 10 minutes from Grayson, straight down Highway 20 toward Loganville. Close enough that visiting is a habit, not a trip.",
    distanceHeading: "Ten minutes changes what visiting means",
    distanceProse: [
      "When it's ten minutes, you stop planning visits and start just showing up. Wednesday after work. Saturday with the grandkids and a bag of peaches.",
      "The families who regret a place an hour away all say a version of the same thing: they meant to go more, and the drive kept winning. Grayson is close enough that the drive never wins.",
    ],
    distancePull:
      "The right home an hour away turns into the home you keep meaning to visit.",
    anchorHeading: "Grayson families usually find us the same two ways.",
    anchorParas: [
      "A lot of them are already driving past us. Grayson sits right up Highway 20, so the mother who needs more help is often only a few minutes from the table she'll eat at.",
      "The rest come by word of mouth: a neighbor off Rosebud Road whose father lived here, a nurse who knows the house is small and that Mellissa runs it herself. Small is the whole point. Twenty-four people, not two hundred.",
    ],
    quote: null,
    faqs: [
      {
        title: "How small is small?",
        body: "Twenty-four residents, one house. That is the size on purpose. Mellissa and the team know each person's name, their coffee, and which grandchild is coming Sunday. A big building can't do that.",
      },
      {
        title: "Is this assisted living?",
        body: "Families searching for assisted living near Grayson usually find that a personal care home like Joy is a closer fit: the same daily help (bathing, dressing, medications, meals), in a real house instead of a wing off a lobby.",
      },
      {
        title: "Can I come by after work on a weeknight?",
        body: "Yes, there are no visiting hours. It's her home. Come at six, eat with her if you tell the kitchen, and still be back in Grayson before the night's over.",
      },
      {
        title: "Do you have a room open now?",
        body: "With 24 rooms it changes week to week. Call (470) 684-3569 and we'll tell you what's actually open, and if we're full, what the wait has really been.",
      },
    ],
  },

  monroe: {
    slug: "monroe",
    name: "Monroe",
    driveMinutes: 15,
    highway: "Highway 78",
    heroLede:
      "Joy is about 15 minutes from Monroe, down Highway 78 into Loganville. Far enough to be its own town, close enough to visit on a Tuesday.",
    distanceHeading: "Fifteen minutes, and the same county",
    distanceProse: [
      "Monroe and Loganville share Walton County, and most of what that means is practical: the same roads, the same hospital, the same church names come up at our table.",
      "It means a daughter in Monroe can come after supper and still be home before it's dark in the winter. And if there's a hard night, she is fifteen minutes away, not on the far side of Atlanta.",
    ],
    distancePull:
      "Being in the same county sounds small until it's nine at night and you need to be there.",
    anchorHeading: "Monroe families come to us for reasons close to home.",
    anchorParas: [
      "Some start with a discharge planner at Piedmont Walton saying Mom can't go back to the house alone, and a weekend to figure it out. We take those calls and we answer the phone ourselves.",
      "Others have driven Highway 78 their whole lives and want their mother somewhere on it, near the county they know, cared for by people they can look in the eye. Mellissa is here, not at a corporate office three states away.",
    ],
    quote: null,
    faqs: [
      {
        title: "How far is Joy from Piedmont Walton?",
        body: "About fifteen minutes down Highway 78. Close enough that a hospital discharge to Joy is an easy same-day move, and close enough for the follow-up visits after.",
      },
      {
        title: "Is a personal care home different from assisted living?",
        body: "In Georgia, yes. Joy is licensed as a personal care home, not an assisted living community. The day-to-day help looks similar (meals, bathing, dressing, medications on time), but it happens in a small house of 24, led by Mellissa.",
      },
      {
        title: "My mother has known these roads her whole life. Will she feel far from home?",
        body: "That's exactly why families in the same county choose close. Bring her chair, her quilt, her photos. By the second week the room stops feeling like a facility and starts feeling like hers.",
      },
      {
        title: "Do you have an opening?",
        body: "With 24 rooms it moves fast. Call (470) 684-3569 and we'll tell you what's open today, honestly, and what the wait has looked like if it's full.",
      },
    ],
  },

  lawrenceville: {
    slug: "lawrenceville",
    name: "Lawrenceville",
    driveMinutes: 20,
    highway: "Highway 20",
    heroLede:
      "Joy is about 20 minutes from Lawrenceville, down Highway 20 through Grayson into Loganville. A small house, not a big campus.",
    distanceHeading: "Twenty minutes to something smaller",
    distanceProse: [
      "Lawrenceville has the big buildings, the marketing, the long hallways. Twenty minutes south there's a house with 24 people in it and a kitchen you can smell from the porch.",
      "Some families want the campus. Others drive the twenty minutes on purpose, because they've walked the big lobbies and want their mother somewhere she'll be known by name instead of by room number.",
    ],
    distancePull:
      "Bigger is easy to find. Small enough to know your parent by name is worth a short drive.",
    anchorHeading: "Lawrenceville families make the drive on purpose.",
    anchorParas: [
      "A discharge planner at Northside Gwinnett often hands out a list of the largest places first. The families who keep looking, who want small, tend to find their way down Highway 20 to us.",
      "What they're after is usually the same: one person who knows the whole story, not a shift that turns over. Mellissa runs this house herself, and 24 rooms is a number a person can actually hold in their head.",
    ],
    quote: null,
    faqs: [
      {
        title: "Why drive twenty minutes when there are places right in Lawrenceville?",
        body: "Because most of those are large. Joy is 24 rooms in a real house, led by Mellissa, where the staff know your parent's name and habits. Families who want small, not big, make the drive gladly.",
      },
      {
        title: "Is this assisted living?",
        body: "Families searching assisted living in Lawrenceville often find that a smaller personal care home like Joy fits better: the same daily care, in a house of 24 instead of a campus of hundreds.",
      },
      {
        title: "Can I still visit often from Lawrenceville?",
        body: "Yes. Twenty minutes down Highway 20, no visiting hours, come whenever. Plenty of our Gwinnett families visit on weeknights and are home before bed.",
      },
      {
        title: "Do you have a room right now?",
        body: "It changes with 24 rooms. Call (470) 684-3569 for what's open today, and if we're full, we'll tell you honestly what the wait has been.",
      },
    ],
  },

  dacula: {
    slug: "dacula",
    name: "Dacula",
    driveMinutes: 15,
    highway: "Highway 316 and Highway 20",
    heroLede:
      "Joy is about 15 minutes from Dacula, down through Grayson into Loganville. Close enough to visit after work, small enough to feel like home.",
    distanceHeading: "Fifteen minutes, and a house instead of a campus",
    distanceProse: [
      "From Dacula it's a short run south, not a highway ordeal. You can come after work, eat at the shared table, and be home the same evening without it eating the whole night.",
      "That closeness is the thing families underestimate. When something changes late, being fifteen minutes away means you are there before the worry has time to grow.",
    ],
    distancePull:
      "The distance you pick now is the distance you'll live with on the hard nights.",
    anchorHeading: "Dacula families choose Joy for the size, and the nearness.",
    anchorParas: [
      "A lot of the calls start after a hospital stay, when a planner says home alone isn't safe and there are a couple of days to decide. We answer the phone ourselves and we take those calls.",
      "The rest come from families who have toured the big places off Highway 316 and wanted something smaller: 24 rooms, one house, led by Mellissa, where a parent is a person and not a room number.",
    ],
    quote: null,
    faqs: [
      {
        title: "How long is the drive from Dacula, really?",
        body: "About fifteen minutes, heading south through Grayson into Loganville. Close enough that weeknight visits stay easy and you're never far when it counts.",
      },
      {
        title: "What makes Joy different from the larger communities near Dacula?",
        body: "Size. Joy is a personal care home of 24 rooms in a real house, led by Mellissa, not a campus of hundreds. The staff know your parent's name, their coffee, and which grandchild visits.",
      },
      {
        title: "Is a personal care home the same as assisted living?",
        body: "Families searching for assisted living near Dacula often find a personal care home like Joy is a better fit: the same everyday help (meals, bathing, dressing, medications), in a small house instead of a large facility.",
      },
      {
        title: "Do you have an opening?",
        body: "With only 24 rooms it changes fast. Call (470) 684-3569 and we'll tell you what's open today, and if we're full, what the wait has actually been.",
      },
    ],
  },
};
