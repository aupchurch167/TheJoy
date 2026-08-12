/**
 * Suggested hero-image prompt for the blog editor. Pure string building, so it
 * is safe to import in the client editor. It leans toward warm, editorial,
 * atmosphere-first imagery (light, hands, a porch, a table) rather than
 * fabricated "photos" of Joy, real residents, staff, or branding. Generated
 * images are illustrations, not real photos of the home (see the editor note).
 *
 * Two things this version fixes:
 *  1. It reads the WHOLE post (title + excerpt + category), not the title alone,
 *     so Gemini gets the post's actual angle.
 *  2. It commits to ONE concrete scene chosen to match the post's theme, and
 *     rotates through alternatives on each re-suggest. The old version handed
 *     Gemini the same four-item menu every time with "rocking chairs" first, so
 *     it kept returning rocking chairs. A single, varied directive fixes that.
 *
 * Business facts are the single-source ones from src/lib/site.ts, repeated here
 * only so the client bundle does not pull in that whole module.
 */
const BUSINESS_NAME = "Joy Senior Living";
const CITY = "Loganville, Georgia";

type Theme = {
  /** Case-insensitive substrings that select this theme. */
  match: string[];
  /** Concrete, single-subject scenes. One is chosen per suggestion. */
  scenes: string[];
  /** Optional light/mood override for this theme. */
  mood?: string;
};

const DEFAULT_MOOD =
  "Warm morning light and a calm, hopeful mood, atmospheric rather than staged";

/**
 * Theme table, checked in order. The first theme whose keyword appears in the
 * title/excerpt/category wins, so put more specific themes first.
 */
const THEMES: Theme[] = [
  {
    match: ["move-in", "move in", "moving", "first day", "first week", "settle", "transition", "welcome", "new home", "new resident"],
    scenes: [
      "a small bedroom being made cozy, a familiar quilt folded on the bed and a framed family photo on the nightstand",
      "an open suitcase and a few treasured belongings on a neatly made bed beside a sunlit window",
      "fresh flowers and a handwritten welcome note on a dresser in a tidy, light-filled room",
    ],
  },
  {
    match: ["memory", "dementia", "alzheimer", "cognitive", "forget", "confusion"],
    scenes: [
      "a gentle close-up of two hands holding, one older and one younger, resting together on a lap",
      "an old photo album open on a quilted bedspread in soft window light",
      "a calm, softly lit sitting room with a comfortable armchair beside a window",
    ],
    mood: "Soft, reassuring light and a gentle, unhurried mood",
  },
  {
    match: ["meal", "food", "dining", "kitchen", "cook", "nutrition", "breakfast", "lunch", "dinner", "eat", "recipe"],
    scenes: [
      "a home-cooked breakfast on a wooden kitchen table, steam rising from a mug",
      "fresh vegetables and a shared meal being set out on a farmhouse table",
      "two cups of coffee and a plate of warm biscuits on a sunlit table",
    ],
  },
  {
    match: ["garden", "outdoor", "outside", "nature", "walk", "spring", "summer", "flower", "porch", "patio", "yard"],
    scenes: [
      "a quiet garden path with blooming flowers in soft focus",
      "a watering can and potted plants on a sunlit patio",
      "hands tending a raised garden bed in gentle morning light",
      "a sunlit front porch with rocking chairs and a folded blanket",
    ],
  },
  {
    match: ["family", "visit", "daughter", "son", "grandchild", "grandparent", "adult child", "sibling", "reunion"],
    scenes: [
      "an older person and an adult child sitting close together, talking quietly",
      "three generations around a kitchen table, warm and unposed",
      "a grandparent and grandchild looking at a picture book together",
    ],
  },
  {
    match: ["activity", "music", "hobby", "craft", "game", "social", "club", "art", "sing"],
    scenes: [
      "a table set for a craft afternoon, yarn and scissors in warm light",
      "an open songbook and a cup of tea beside a sunny window",
      "a card game mid-play on a wooden table, hands and warm light only",
    ],
  },
  {
    match: ["medication", "medicine", "health", "nurse", "safety", "fall", "mobility", "assist", "care plan", "bath"],
    scenes: [
      "a caregiver's hand gently steadying an older person's hand on a railing",
      "a neatly organized morning routine on a bright counter, folded towels and a glass of water",
      "soft daylight across a tidy, safe bathroom with a grab bar and a fresh towel",
    ],
  },
  {
    match: ["cost", "price", "budget", "finance", "pay", "afford", "plan", "checklist", "compare", "decision", "decid", "choose", "signs", "is it time", "when it's time", "when its time", "ready for"],
    scenes: [
      "a calm kitchen table with a notebook, a pen, and a cup of coffee in morning light",
      "sunlight across an organized desk with a folder and a pair of reading glasses",
      "an open notebook and a warm mug by a bright window, quiet and unhurried",
    ],
  },
  {
    match: ["holiday", "christmas", "thanksgiving", "season", "celebrate", "birthday"],
    scenes: [
      "a cozy living room with soft seasonal touches and warm evening light",
      "a table set for a small family gathering, candlelight and warm tones",
    ],
    mood: "Cozy, warm evening light and a gentle, homey mood",
  },
  {
    match: ["winter", "cold", "snow"],
    scenes: [
      "a warm interior with a soft blanket and a mug of tea by a frosty window",
      "morning light through a window onto a comfortable chair and a folded throw",
    ],
  },
];

/** General pool when no theme matches. Rocking chairs is one option, not the default. */
const GENERAL_SCENES = [
  "a cup of coffee on a wooden kitchen table in soft morning light",
  "a quiet garden in gentle soft focus",
  "the hands of an older person and an adult child resting together",
  "soft light falling across a comfortable, lived-in sitting room",
  "a vase of fresh flowers on a sunlit windowsill",
  "a well-worn armchair by a bright window with a folded blanket",
  "a sunlit front porch with rocking chairs and a folded blanket",
];

/** Stable, deterministic hash so a given title starts at a consistent scene. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Trim an excerpt to a short, single-line phrase for prompt context. */
function shortExcerpt(excerpt?: string): string {
  const e = (excerpt || "").replace(/\s+/g, " ").trim();
  if (!e) return "";
  return e.length > 160 ? `${e.slice(0, 157).trimEnd()}…` : e;
}

/**
 * Build a suggested prompt. `variant` rotates the chosen scene, so the editor's
 * "Suggest a prompt" button lands on a different scene each click (and different
 * posts start on different scenes).
 */
export function suggestHeroPrompt(
  fields: { title?: string; excerpt?: string; category?: string },
  variant = 0
): string {
  const title = (fields.title || "").trim();
  const excerpt = (fields.excerpt || "").trim();
  const category = (fields.category || "").trim();

  const haystack = `${title} ${excerpt} ${category}`.toLowerCase();
  const theme = THEMES.find((t) => t.match.some((m) => haystack.includes(m)));
  const scenes = theme ? theme.scenes : GENERAL_SCENES;
  const mood = theme?.mood || DEFAULT_MOOD;

  // Start scene from the title hash (so posts differ), then rotate by variant.
  const idx = (hash(title || category || "joy") + variant) % scenes.length;
  const scene = scenes[idx];

  const topic = title || category || "senior living and caring for a parent";
  const aboutClause = shortExcerpt(excerpt)
    ? ` The post is about: ${shortExcerpt(excerpt)}.`
    : category
      ? ` The post is in the "${category}" category.`
      : "";

  return `An editorial, photorealistic hero image for a blog post titled "${topic}" for ${BUSINESS_NAME}, a small personal care home in ${CITY}.${aboutClause} ${mood}. Focus on one clear subject: ${scene}. Documentary style, natural tones, gentle depth of field, no people's faces in sharp focus. No text, no words, no logos, no signage.`;
}

/** A reasonable default alt line for a generated hero, editable by the author. */
export function defaultHeroAlt(fields: { title?: string }): string {
  const t = (fields.title || "").trim();
  return t
    ? `Illustration for “${t}”`
    : "Illustration for a Joy Senior Living blog post";
}
