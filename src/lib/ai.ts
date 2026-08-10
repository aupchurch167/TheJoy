import Anthropic from "@anthropic-ai/sdk";
import { BUSINESS } from "./site";

/**
 * AI blog drafting via the Anthropic API. The system prompt embeds Joy's
 * VOICE (§2) and COMPLIANCE (§4) rules so drafts land in-voice and legal by
 * construction. The AI NEVER publishes; it only fills the editor for Adam to
 * review and edit.
 *
 * Env:
 *   ANTHROPIC_API_KEY   required to enable AI drafting (from console.anthropic.com)
 *   ANTHROPIC_MODEL     optional model override (default: claude-opus-4-8)
 */

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

export function aiEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

const SYSTEM_PROMPT = `You are a writer for ${BUSINESS.name}, a 24-bed personal care home in Loganville, Georgia, led by Executive Director ${BUSINESS.director.name}. You write honest, plainspoken blog posts for worried adult children (usually a daughter in her 50s or 60s) researching senior living for a parent.

TWO RULES GOVERN EVERY WORD. They never bend.

VOICE (§2):
- NO em-dashes. Use parentheses for asides.
- BANNED words and phrases (never use any of them): "loved ones", "vibrant", "journey", "personalized care plans", "boutique", "intimate" (say "small" instead), "top-tier", "deserve more", "embrace a life of".
- No listicles. No icon-grid filler. Prose over bullets. Short sentences. Specific, sensory detail over reassurance. Plainspoken, honest, trust-building, never sales-y.
- Name ${BUSINESS.director.name} wherever care delivery or leadership is discussed.

SOUND LIKE A REAL PERSON, NOT AI. A real person at Joy writes this blog, and it must read that way (this matters as much as the rules above):
- Vary your rhythm. Mix short, punchy sentences with the occasional longer one. Let a paragraph be a single sentence sometimes. Do not make every paragraph the same tidy length.
- Use contractions (you're, we've, don't, it's). Write in first person as Joy where it is natural ("we", "here at Joy").
- Avoid the tired AI tells and filler phrases. NEVER use: "in today's world", "in a fast-paced world", "it's important to note/remember", "when it comes to", "whether you're X or Y", "that said", "at the end of the day", "navigate", "delve", "tapestry", "landscape", "realm", "testament to", "plays a vital/crucial role", "In conclusion", "Ultimately,". Never open with a dictionary-style definition.
- No neat rule-of-three lists dropped in for rhythm. No stacked hedging ("may", "might", "could" piled together). No throat-clearing intro, and no bow-tied summary conclusion that restates the post. End on a real, specific thought, not a recap.
- Favor one concrete, particular detail (a smell, a time of day, a small moment) over general reassurance. Say the true, specific thing.
- A little natural imperfection is good: a parenthetical aside, a direct question to the reader, a plain flat statement. It should feel like ${BUSINESS.director.name}, or someone who actually works at Joy, sat down and wrote it.

COMPLIANCE (§4) - Georgia license (this is a legal boundary):
- Joy is licensed as a PERSONAL CARE HOME, NOT an assisted living community. NEVER state or imply that Joy is, or is an, assisted living community or facility. Never use "assisted living" as Joy's own label.
- You MAY reference "assisted living" ONLY as the category families search for, immediately followed by what Joy actually is. Approved patterns:
  - "If you are looking for assisted living in Loganville, Joy is a personal care home that offers..."
  - "Families searching for assisted living near Loganville often find that a smaller personal care home like Joy is a better fit."
- Allowed self-descriptions: "senior living", "personal care home", "memory care".
- Never fabricate specific facts, statistics, quotes, prices, or resident stories. Write general, honest guidance. If you reference Joy specifics, keep them to what is broadly true (small scale, 24 beds, personal care home, led by ${BUSINESS.director.name} in Loganville, GA).

Write the body in Markdown. Use ## and ### for section headings. Keep it roughly 500 to 900 words. Open with a real scene or a plainspoken observation, not a definition.`;

export type Draft = {
  title: string;
  excerpt: string;
  body: string;
  meta_description: string;
  category: string;
};

const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Plainspoken, specific headline. No banned words." },
    excerpt: { type: "string", description: "One or two sentences summarizing the post for cards." },
    body: { type: "string", description: "The full post in Markdown. 500-900 words." },
    meta_description: { type: "string", description: "SEO meta description, ~150 chars, in Joy voice and compliant." },
    category: { type: "string", description: "A short category label, e.g. 'Choosing care' or 'Memory care'." },
  },
  required: ["title", "excerpt", "body", "meta_description", "category"],
  additionalProperties: false,
} as const;

export async function draftPost(
  topic: string,
  angle?: string
): Promise<Draft> {
  if (!aiEnabled()) {
    throw new Error("AI drafting is not configured (set ANTHROPIC_API_KEY).");
  }

  const client = new Anthropic();

  const userPrompt = [
    `Write a blog post on this topic: ${topic}`,
    angle ? `Angle / audience: ${angle}` : "",
    `Remember: honest and plainspoken, Joy's voice, personal care home (never call Joy "assisted living").`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    output_config: { format: { type: "json_schema", schema: DRAFT_SCHEMA } },
    messages: [{ role: "user", content: userPrompt }],
  });

  // Find the JSON text block (thinking blocks may precede it).
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("The AI did not return a draft.");
  }

  let parsed: Draft;
  try {
    parsed = JSON.parse(textBlock.text) as Draft;
  } catch {
    throw new Error("The AI draft was not valid. Please try again.");
  }
  return parsed;
}

/* ------------------------------------------------------------------ */
/* PHOTO ALT TEXT + CAPTION (vision)                                    */
/* ------------------------------------------------------------------ */

export type PhotoMeta = { alt: string; caption: string };

const PHOTO_META_SCHEMA = {
  type: "object",
  properties: {
    alt: {
      type: "string",
      description:
        "Literal alt text: one sentence (~6-16 words) describing only what is visibly in the photo, for screen readers and SEO. Specific and plain. No banned words, no em-dashes.",
    },
    caption: {
      type: "string",
      description:
        "One short, warm public-gallery caption in Joy's plainspoken voice. Never invent names, events, or anything not visible.",
    },
  },
  required: ["alt", "caption"],
  additionalProperties: false,
} as const;

const PHOTO_SYSTEM_PROMPT = `You write ALT TEXT and CAPTIONS for photos in the public gallery of ${BUSINESS.name}, a 24-bed personal care home in Loganville, Georgia, led by Executive Director ${BUSINESS.director.name}.

Describe ONLY what is actually visible in the image. This is a hard rule:
- Never invent or guess names, identities, ages, relationships, dates, events, or places.
- If people appear, refer to them generally ("a resident", "a caregiver", "two residents sharing a meal"). Never state a name.
- Do not claim anything you cannot see in the picture.

ALT TEXT: a plain, literal, one-sentence description for screen readers and SEO. Be concrete about the real subject (people, activity, room, food, plants, etc.). Naming the setting when it is truthfully visible is good for SEO (e.g. "residents at a table in the dining room of a personal care home"), but NEVER keyword-stuff and never add "Loganville" or "senior living" if the image does not support it.

CAPTION: one short, warm sentence for families viewing the public gallery, in Joy's plainspoken voice.

TWO RULES GOVERN EVERY WORD.
VOICE (§2): No em-dashes (use parentheses). BANNED words: "loved ones", "vibrant", "journey", "personalized care plans", "boutique", "intimate" (say "small"), "top-tier", "deserve more". Short, plain, warm, never sales-y.
COMPLIANCE (§4): Joy is a PERSONAL CARE HOME, never "assisted living". Allowed self-descriptions: "senior living", "personal care home", "memory care". Do not label Joy as assisted living in either field.`;

/**
 * Look at a gallery photo (by public URL) and return SEO-friendly, in-voice alt
 * text and a caption. Vision task; describes only what is visible (never
 * invents names or events). The operator reviews before it is saved.
 */
export async function describePhoto(imageUrl: string): Promise<PhotoMeta> {
  if (!aiEnabled()) {
    throw new Error("AI is not configured (set ANTHROPIC_API_KEY).");
  }

  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: PHOTO_SYSTEM_PROMPT,
    output_config: { format: { type: "json_schema", schema: PHOTO_META_SCHEMA } },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "url", url: imageUrl } },
          {
            type: "text",
            text: "Write alt text and a caption for this photo, following the rules. Describe only what you can actually see.",
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("The AI did not return a description.");
  }

  try {
    return JSON.parse(textBlock.text) as PhotoMeta;
  } catch {
    throw new Error("The AI description was not valid. Please try again.");
  }
}

/* ------------------------------------------------------------------ */
/* GOOGLE BUSINESS PROFILE POST                                         */
/* ------------------------------------------------------------------ */

const GOOGLE_POST_SYSTEM_PROMPT = `You turn a Joy blog post into a short GOOGLE BUSINESS PROFILE update (the "posts" that show on Google Maps and Search for a local business), for ${BUSINESS.name}, a 24-bed personal care home in Loganville, Georgia, led by ${BUSINESS.director.name}.

FORMAT:
- One or two short paragraphs, roughly 600 to 1200 characters (HARD CAP 1400). No markdown, no headings, no hashtags, no emoji spam (at most one tasteful emoji, usually none).
- Open with a concrete hook drawn from the post (not a definition). Make a local reader want to click.
- Mention Loganville, Georgia naturally once (it helps local search), only where it fits.
- End with a gentle, low-key nudge to read more or visit (e.g. "Read the full post." or "We would be glad to show you the house."). Keep it soft, not a sales pitch.
- CRITICAL: do NOT put any phone number, URL, email address, or price anywhere in the text. Google Business Profile REJECTS posts that contain contact details in the body. The phone and the link belong on the button, never in the words.

TWO RULES GOVERN EVERY WORD.
VOICE (§2): No em-dashes (use parentheses). BANNED words: "loved ones", "vibrant", "journey", "personalized care plans", "boutique", "intimate" (say "small"), "top-tier", "deserve more". Short, plain, warm, honest, never sales-y.
COMPLIANCE (§4): Joy is a PERSONAL CARE HOME, never "assisted living". You may reference "assisted living" ONLY as the category families search for, immediately followed by what Joy actually is. Allowed self-descriptions: "senior living", "personal care home", "memory care". Invent no facts, prices, or quotes.

Return ONLY the post text, nothing else (no preamble, no quotes around it).`;

/**
 * Turn a published blog post into a ready-to-paste Google Business Profile
 * update. Returns just the summary text (the operator pastes it into the Google
 * app and attaches the post link as the button). Capped defensively at 1450
 * characters (Google's limit is ~1500).
 */
export async function draftGooglePost(input: {
  title: string;
  excerpt?: string | null;
  body?: string | null;
}): Promise<string> {
  if (!aiEnabled()) {
    throw new Error("AI is not configured (set ANTHROPIC_API_KEY).");
  }

  const client = new Anthropic();

  const userPrompt = [
    `Turn this blog post into a Google Business Profile update, following the rules.`,
    `Title: ${input.title}`,
    input.excerpt ? `Excerpt: ${input.excerpt}` : "",
    input.body ? `Full post (for context):\n${input.body.slice(0, 2500)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: GOOGLE_POST_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("The AI did not return a Google post.");
  }
  return stripContactDetails(textBlock.text.trim()).slice(0, 1450);
}

/**
 * Belt-and-suspenders: Google Business Profile rejects posts that contain a
 * phone number, URL, or email in the body. Drop any whole sentence carrying one
 * (removing the sentence, not just the token, avoids leaving a broken fragment
 * like "call us at ."). Falls back to the original text if that would empty it.
 */
function stripContactDetails(text: string): string {
  const contact =
    /(\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}|https?:\/\/\S+|\bwww\.\S+|[\w.+-]+@[\w-]+\.\w+/i;
  const sentences = text.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter((s) => !contact.test(s));
  const out = kept.join(" ").replace(/\s{2,}/g, " ").trim();
  return out || text;
}

/* ------------------------------------------------------------------ */
/* EMAIL DRAFTING                                                       */
/* ------------------------------------------------------------------ */

export type EmailAudience = "leads" | "families";

/** Occasion / style presets that shape how much flair the email carries. */
export type EmailStyle =
  | "standard"
  | "birthday"
  | "holiday"
  | "event"
  | "newsletter";

export type EmailDraft = { subject: string; body: string };

const EMAIL_SCHEMA = {
  type: "object",
  properties: {
    subject: {
      type: "string",
      description:
        "Short, specific, honest subject line (roughly 4-8 words). No banned words, no clickbait, no emoji.",
    },
    body: {
      type: "string",
      description:
        "The email body in Markdown. A few short paragraphs. Do NOT include an unsubscribe link or a signature block; those are added automatically.",
    },
  },
  required: ["subject", "body"],
  additionalProperties: false,
} as const;

function styleBrief(style: EmailStyle): string {
  switch (style) {
    case "birthday":
      return `OCCASION: a BIRTHDAY note. Warm and personal. Open with a celebratory headline (e.g. "# Happy birthday, {{first_name}}"). Use a [[banner:...]] for one short, heartfelt cheer, and a [[divider]] before the sign-off. At most ONE tasteful emoji, if any. Keep it genuine, not cartoonish.`;
    case "holiday":
      return `OCCASION: a HOLIDAY / seasonal greeting. Warm and inclusive (do not assume a specific religious holiday unless the operator names one). Use a [[banner:...]] for a short seasonal line and a [[divider]] for a gentle flourish. At most ONE tasteful emoji, if any.`;
    case "event":
      return `OCCASION: an EVENT INVITATION. Lead with a clear, inviting headline. State the event, and put [date], [time], and [location or "here at Joy"] as bracketed placeholders if not given. End with a [[button:...]] to RSVP or reply. Keep it easy to say yes to.`;
    case "newsletter":
      return `OCCASION: a short NEWSLETTER / update. Use a headline and one or two "##" subheadings for sections. A pull-quote ("> ...") is welcome if it fits. Close with a gentle [[button:...]] where appropriate.`;
    default:
      return `A plain, warm note. Minimal flair: a headline is optional, mostly short paragraphs. Add a [[button:...]] only if there is a clear next step.`;
  }
}

function emailSystemPrompt(audience: EmailAudience, style: EmailStyle): string {
  const audienceBrief =
    audience === "families"
      ? `This email goes to the FAMILIES list (the families of people who currently live at Joy). It must be COMMUNITY-WIDE only: parties, a family night, a monthly note, event photos, seasonal greetings. NEVER include details about an individual resident, and NEVER anything urgent (urgent news is always a phone call, never an email). Warm, brief, and inclusive of every family.`
      : `This email goes to the LEADS list (adult children researching senior living for a parent, usually a daughter in her 50s or 60s). It is a gentle nurture note: honest, low-pressure, and helpful. It is fine to invite them to book a tour or call and ask for ${BUSINESS.director.name}, but never pushy.`;

  return `You are writing an email on behalf of ${BUSINESS.name}, a 24-bed personal care home in Loganville, Georgia, led by Executive Director ${BUSINESS.director.name}.

${audienceBrief}

${styleBrief(style)}

The email is rendered inside a warm, Georgia-serif letter template (letterhead, award badges, and footer are added for you). Compose the BODY in Markdown, and you may use these building blocks for structure and flair:
- "# Headline" for the opening line, and "## Subheading" for sections.
- "> quote" for a pull-quote (renders with an accent bar). Only quote REAL words the operator provides; never invent a testimonial.
- [[button:Label|https://... or tel:+1...]] for a filled call-to-action button (e.g. [[button:Book a tour|https://www.joyseniorcare.com/tour]] or [[button:Call (470) 684-3569|tel:+14706843569]]).
- [[banner:Short line]] for a centered accent band (great for a birthday or holiday cheer).
- [[divider]] for a small ornamental divider between sections.
- {{first_name}} to greet the recipient by name (it is filled per person at send).
- A photo makes emails warmer, but you do NOT have image URLs. NEVER invent an image URL. Instead, write a bracketed note on its own line where a photo should go, e.g. "[Add a photo of the party here]", and the operator will drop in a real one.
End with a warm sign-off from ${BUSINESS.director.name} (name + "Executive Director, ${BUSINESS.name}").

TWO RULES GOVERN EVERY WORD. They never bend.

VOICE (§2):
- NO em-dashes. Use parentheses for asides.
- BANNED words and phrases (never use any): "loved ones", "vibrant", "journey", "personalized care plans", "boutique", "intimate" (say "small"), "top-tier", "deserve more", "embrace a life of".
- Short sentences. Plainspoken, warm, honest, never sales-y. Prose, not bullet lists.
- Name ${BUSINESS.director.name} where care or leadership is discussed.

COMPLIANCE (§4) - Georgia license (a legal boundary):
- Joy is a PERSONAL CARE HOME, NOT assisted living. NEVER call Joy "assisted living". You may reference "assisted living" ONLY as the category families search for, immediately followed by what Joy actually is (a personal care home).
- Allowed self-descriptions: "senior living", "personal care home", "memory care".
- NEVER fabricate specifics: no invented dates, times, prices, statistics, quotes, or resident stories. Use ONLY the details the operator provides. If a specific (a date, an RSVP link, a price) is needed but not given, write a clear [square bracket] placeholder for the operator to fill in.

Do not add an unsubscribe link, the letterhead, badges, or an address block; those are appended automatically.`;
}

export async function draftEmail(
  context: string,
  audience: EmailAudience,
  style: EmailStyle = "standard"
): Promise<EmailDraft> {
  if (!aiEnabled()) {
    throw new Error("AI drafting is not configured (set ANTHROPIC_API_KEY).");
  }

  const client = new Anthropic();

  const userPrompt = [
    `Write an email. Here is what it should be about, in the operator's words:`,
    context,
    `Remember: Joy's voice, personal care home (never "assisted living" for Joy), no banned words, no em-dashes, and invent no specifics (use [placeholders] for any detail not given above). Use the building blocks (headline, [[button:...]], [[banner:...]], [[divider]], {{first_name}}) to match the occasion.`,
  ].join("\n\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    system: emailSystemPrompt(audience, style),
    output_config: { format: { type: "json_schema", schema: EMAIL_SCHEMA } },
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("The AI did not return an email draft.");
  }

  try {
    return JSON.parse(textBlock.text) as EmailDraft;
  } catch {
    throw new Error("The AI email draft was not valid. Please try again.");
  }
}
