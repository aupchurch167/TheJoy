import Anthropic from "@anthropic-ai/sdk";
import { BUSINESS } from "./site";
import { BIRTHDAY_INVITE_HTML } from "./email-designs";
import type { EmailPlan } from "./email-model";

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
/* FAMILY FEEDBACK SUMMARY                                              */
/* ------------------------------------------------------------------ */

export type FeedbackDigest = {
  overview: string;
  praises: string[];
  improvements: string[];
  quotes: string[];
};

const FEEDBACK_DIGEST_SCHEMA = {
  type: "object",
  properties: {
    overview: {
      type: "string",
      description:
        "2 to 4 plain sentences: the overall read across all the feedback (how families feel, the general trend). No banned words, no em-dashes.",
    },
    praises: {
      type: "array",
      items: { type: "string" },
      description:
        "Recurring positive themes families mention, each a short phrase or sentence. Empty if none.",
    },
    improvements: {
      type: "array",
      items: { type: "string" },
      description:
        "Recurring concerns or requests to act on, each a short phrase or sentence. Empty if none.",
    },
    quotes: {
      type: "array",
      items: { type: "string" },
      description:
        "Up to 4 short, representative quotes copied VERBATIM from the comments provided. Never invent or paraphrase a quote.",
    },
  },
  required: ["overview", "praises", "improvements", "quotes"],
  additionalProperties: false,
} as const;

const FEEDBACK_SYSTEM_PROMPT = `You summarize FAMILY FEEDBACK for the leadership of ${BUSINESS.name}, a 24-bed personal care home in Loganville, Georgia, led by ${BUSINESS.director.name}. This is an internal analysis to help the team see what families are saying, not marketing copy.

Your job: read the survey responses (ratings and written comments) and distill the key themes honestly.
- Base EVERYTHING only on the comments provided. Never invent a theme, a number, or a quote. If there is little to go on, say so briefly.
- Quotes must be copied word for word from the comments. Do not paraphrase a quote or attribute it to anyone by name.
- Be balanced: surface genuine praise AND real concerns. Do not soften a pattern of complaints.
- Plain, direct, useful. Short sentences.

STYLE: No em-dashes (use parentheses). Do not use these words: "loved ones", "vibrant", "journey", "personalized care plans", "boutique", "intimate", "top-tier", "deserve more". Refer to Joy as a personal care home, never "assisted living".`;

/**
 * Summarize a batch of family feedback into an overview, recurring praises and
 * improvements, and a few verbatim quotes. Grounded only in the comments given,
 * so it never fabricates. Used by the shareable report.
 */
export async function summarizeFeedback(input: {
  period: string;
  count: number;
  avgOverall: number | null;
  positive: number;
  concern: number;
  comments: {
    rating: number;
    recommend?: string | null;
    goingWell?: string | null;
    couldBeBetter?: string | null;
    suggestions?: string | null;
    anonymous?: boolean;
  }[];
}): Promise<FeedbackDigest> {
  if (!aiEnabled()) {
    throw new Error("AI is not configured (set ANTHROPIC_API_KEY).");
  }

  const withText = input.comments.filter(
    (c) => c.goingWell || c.couldBeBetter || c.suggestions
  );
  if (withText.length === 0) {
    return {
      overview:
        "No written comments were left in this period, so there is nothing to summarize yet. The ratings above still show how families scored their experience.",
      praises: [],
      improvements: [],
      quotes: [],
    };
  }

  const lines = withText.slice(0, 200).map((c, i) => {
    const parts = [
      `Response ${i + 1} (rating ${c.rating}/5${c.recommend ? `, would recommend: ${c.recommend}` : ""}${c.anonymous ? ", anonymous" : ""}):`,
    ];
    if (c.goingWell) parts.push(`  Going well: ${c.goingWell}`);
    if (c.couldBeBetter) parts.push(`  Could be better: ${c.couldBeBetter}`);
    if (c.suggestions) parts.push(`  Suggestions: ${c.suggestions}`);
    return parts.join("\n");
  });

  const userPrompt = [
    `Period: ${input.period}.`,
    `Totals: ${input.count} responses, average rating ${input.avgOverall != null ? input.avgOverall.toFixed(1) : "n/a"} of 5, ${input.positive} positive and ${input.concern} flagged a concern.`,
    ``,
    `Here are the written comments to summarize:`,
    lines.join("\n\n"),
  ].join("\n");

  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: FEEDBACK_SYSTEM_PROMPT,
    output_config: { format: { type: "json_schema", schema: FEEDBACK_DIGEST_SCHEMA } },
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("The AI did not return a summary.");
  }
  try {
    return JSON.parse(textBlock.text) as FeedbackDigest;
  } catch {
    throw new Error("The AI summary was not valid. Please try again.");
  }
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
      return `OCCASION: a RESIDENT'S BIRTHDAY, sent to the families list as a warm invitation to come celebrate. Get WHO IS WHO exactly right, this is the thing that usually goes wrong:
- The RECIPIENT is the family member. Greet them with {{first_name}} ("Hi {{first_name}},").
- The BIRTHDAY PERSON is the RESIDENT, a different person. Use the resident's name exactly as the operator gives it; if no name is given, write "[resident's name]". NEVER put {{first_name}} as the birthday person, and NEVER invent, nickname, or shorten a name (no "MJ", no initials, no pet names).
Open with a headline about the celebration, naming the resident, e.g. "# Happy birthday, [resident's name]" (NOT the recipient). Write two or three warm sentences inviting the family to the party, with one small specific detail (a favorite cake, a song, cards signed by the hall). Use ONE [[banner:...]] for a short heartfelt toast to the resident ("Here's to [resident's name]!"); a toast is a banner, NEVER a button. State the details plainly, using [date], [time], and "here at Joy" as bracketed placeholders when the operator did not give them, and add ONE [[button:...]] only for a real action (RSVP or Call). Name ${BUSINESS.director.name} and the team as the hosts. At most one tasteful emoji. Genuine and specific, never cartoonish.`;
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

/* ------------------------------------------------------------------ */
/* DESIGNED HTML EMAIL (occasion-themed, email-safe)                    */
/* ------------------------------------------------------------------ */

export type EmailOccasion =
  | "birthday"
  | "holiday"
  | "event"
  | "celebration"
  | "thank_you"
  | "announcement";

export type EmailHtmlDraft = {
  subject: string;
  html: string;
  /** true = a complete standalone document (its own header/footer, no Joy shell). */
  standalone: boolean;
};

const EMAIL_HTML_SCHEMA = {
  type: "object",
  properties: {
    subject: {
      type: "string",
      description:
        "Short, warm, specific subject line (~4-8 words). No banned words, no emoji clutter (one tasteful emoji is fine for a birthday).",
    },
    html: {
      type: "string",
      description:
        "The INNER body HTML only (no <html>, <head>, <body>, or doctype). Email-safe: inline styles + tables only. See the rules.",
    },
  },
  required: ["subject", "html"],
  additionalProperties: false,
} as const;

function occasionBrief(occasion: EmailOccasion): string {
  switch (occasion) {
    case "birthday":
      return `OCCASION: a RESIDENT'S BIRTHDAY, sent to families as a warm invitation to celebrate. Get WHO IS WHO exactly right: the RECIPIENT is the family member (greet with {{first_name}}); the BIRTHDAY PERSON is the RESIDENT, a different person (use the resident's name exactly as given, or "[resident's name]" if none). NEVER use {{first_name}} as the birthday person, and NEVER invent, nickname, or shorten a name (no "MJ", no initials). Open with a bold festive banner row (a solid warm color band, rounded corners, a white serif headline like "Happy Birthday, [resident's name]") and one tasteful emoji (🎂 or 🎈). Write two or three heartfelt sentences about the resident and the celebration, with one small specific detail. Put the party details in a clearly boxed block (date, time, place as [bracketed] placeholders when not given) and one bulletproof RSVP/Call button. Warm, about the resident, never sales-y.`;
    case "holiday":
      return `OCCASION: a HOLIDAY / seasonal greeting. Warm, inclusive (do not assume a specific religious holiday unless named). A soft seasonal banner row and a gentle sign-off.`;
    case "event":
      return `OCCASION: an EVENT INVITATION. Lead with an inviting headline, then a clearly boxed "The details" block (date, time, place as [bracketed] placeholders if not given) and one bulletproof RSVP/Call button.`;
    case "celebration":
      return `OCCASION: a CELEBRATION or milestone (anniversary, welcome, good news). Joyful but tasteful, one accent banner.`;
    case "thank_you":
      return `OCCASION: a THANK YOU. Sincere and simple, a warm accent, no hard sell.`;
    default:
      return `OCCASION: a community ANNOUNCEMENT or update. Clean, warm, one clear headline and an optional button.`;
  }
}

const EMAIL_HTML_SYSTEM = `You design a single marketing email for ${BUSINESS.name}, a 24-bed personal care home in Loganville, Georgia, led by ${BUSINESS.director.name}. You return the INNER body HTML that drops into Joy's existing letter template (which already provides the outer page, the letterhead logo, award badges, the address block, and the unsubscribe footer). Do NOT recreate any of those.

OUTPUT: the body content only. NEVER include <!doctype>, <html>, <head>, <body>, <style>, <script>, an unsubscribe link, a footer, an address block, or the Joy logo. Those are added for you.

EMAIL-SAFE HTML (hard rules, inboxes are strict):
- INLINE styles only (style="..."). No <style> blocks, no classes, no external CSS, no JS, no <link>.
- Layout with TABLES (role="presentation", cellpadding/cellspacing="0", border="0", width="100%"). No flexbox, grid, position, or float.
- Fonts: Georgia, 'Times New Roman', serif for body and headlines (matches Joy). A system sans (-apple-system, Segoe UI, Roboto, sans-serif) is OK for a small label. Always give real fallbacks. Never use a web font or @font-face.
- Colors (use these): text #17252b; soft text #4a5a52; muted #7c7a6f; page cream is already behind you (#fbf9f5). Accents: sage green #5a6b45, deep green #2f3b23, teal #01a7ce. For festive occasions you may add ONE warm band color (a muted gold #c98a2c, or a soft coral #d98b6a) but keep it tasteful, never neon.
- Buttons: bulletproof only. A <table> with a single <td> that has the background color, padding (14px 28px), border-radius (8px), and an <a> inside styled white, bold, text-decoration:none. Never a CSS button.
- Images: do NOT invent image URLs and do NOT use <img> unless a real URL is provided in the brief. Create warmth with color bands, rounded boxes, and at most one or two tasteful emoji instead.
- Keep the whole thing within ~600px (use width:100% tables; the shell is 600px). Generous line-height (~1.6). Mobile-friendly by default (fluid tables, no fixed pixel widths on content).

PERSONALIZE: you may use {{first_name}} anywhere (it is filled per recipient at send). If a specific detail is missing (a date, a time, a name), write a clear [bracketed placeholder] for the operator to fill. NEVER invent specifics (dates, prices, quotes, resident stories).

VOICE (§2): NO em-dashes (use parentheses). BANNED words (never use any): "loved ones", "vibrant", "journey", "personalized care plans", "boutique", "intimate" (say "small"), "top-tier", "deserve more". Short, warm, plainspoken sentences. Name ${BUSINESS.director.name} where care or leadership is mentioned.

COMPLIANCE (§4): Joy is a PERSONAL CARE HOME, never "assisted living" as its label. Allowed self-descriptions: "senior living", "personal care home", "memory care".`;

// Birthday invitations are sent STANDALONE (their own festive header + footer,
// no Joy letter shell). This prompt asks for a COMPLETE document and anchors it
// to Joy's approved birthday design so the look stays consistent.
const EMAIL_HTML_STANDALONE_SYSTEM = `You design a COMPLETE, standalone HTML email for ${BUSINESS.name}, a 24-bed personal care home in Loganville, Georgia, led by ${BUSINESS.director.name}. This one is NOT wrapped in Joy's letter template, so YOU provide the entire document, including its own small footer.

OUTPUT: a full valid HTML email document: <!DOCTYPE html><html>...<head><meta charset + viewport>...</head><body>...</body></html>. Nothing else.

EMAIL-SAFE HTML (inboxes are strict): INLINE styles only (no <style>, no classes), table-based layout (role="presentation", no flexbox/grid/position), web-safe fonts (Georgia serif + a system sans, always with fallbacks, never a web font), no <script>/JS, no external CSS or fonts, no <img> unless a real URL is given (use color bands and emoji instead). Bulletproof buttons only (a styled <a> inside a table cell). Keep within ~600px, fluid tables, mobile-friendly.

MATCH THE REFERENCE DESIGN below (same structure, colors, and footer): a hidden preheader line, a colored hero card with an eyebrow ("You're invited"), a big serif headline naming the celebrant, an italic subtitle, confetti/bunting accents, a white body card with the greeting and two short paragraphs, a dashed "party plan" details card with date/time/place rows (emoji icons), a warm sign-off from ${BUSINESS.director.name} and the team, and a small centered footer.

REQUIRED FOOTER (you must include it): "Joy Senior Living • Loganville, GA" and a line "You're receiving this because you're part of the Joy family." with an Unsubscribe link whose href is EXACTLY {{unsubscribe_url}} (a token filled per recipient at send). NEVER invent an unsubscribe URL.

WHO IS WHO: the RECIPIENT is the family member (greet with {{first_name}}); the celebrant is the RESIDENT (use the resident's name exactly as given, or "[resident's name]" if none). NEVER use {{first_name}} as the celebrant, and NEVER invent, nickname, or shorten a name. Use [bracketed placeholders] for any missing detail (date, time). Invent no specifics.

VOICE (§2): NO em-dashes (use parentheses or commas). BANNED words: "loved ones", "vibrant", "journey", "personalized care plans", "boutique", "intimate", "top-tier", "deserve more". Short, warm sentences. Name ${BUSINESS.director.name}.
COMPLIANCE (§4): Joy is a PERSONAL CARE HOME, never "assisted living".`;

/**
 * Design a full, occasion-themed email. Birthday invitations come back as a
 * COMPLETE standalone document (their own header/footer, no Joy shell, matching
 * Joy's approved design); other occasions come back as email-safe INNER HTML
 * that Joy's letter shell wraps (adding the letterhead, badges, and unsubscribe
 * footer). `standalone` on the result tells the caller which it is.
 */
export async function draftEmailHtml(input: {
  context: string;
  audience: EmailAudience;
  occasion: EmailOccasion;
}): Promise<EmailHtmlDraft> {
  if (!aiEnabled()) {
    throw new Error("AI is not configured (set ANTHROPIC_API_KEY).");
  }
  const standalone = input.occasion === "birthday";
  const audienceBrief =
    input.audience === "families"
      ? `This goes to the FAMILIES list (families of current residents). Community-wide and warm; never individual resident details, never anything urgent.`
      : `This goes to the LEADS list (adult children researching senior living for a parent). Warm and low-pressure.`;

  const userPrompt = [
    occasionBrief(input.occasion),
    audienceBrief,
    ``,
    `Here is what the email is about, in the operator's words:`,
    input.context,
    ``,
    standalone
      ? `Return the subject and the COMPLETE HTML document. Reuse the structure, colors, and footer of this reference design exactly, swapping in the details from above (and [bracketed placeholders] for anything missing):\n\n${BIRTHDAY_INVITE_HTML}`
      : `Return the subject and the inner body HTML, following every rule. Use [placeholders] for any specific detail not given above.`,
  ].join("\n");

  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system: standalone ? EMAIL_HTML_STANDALONE_SYSTEM : EMAIL_HTML_SYSTEM,
    output_config: { format: { type: "json_schema", schema: EMAIL_HTML_SCHEMA } },
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("The AI did not return an email design.");
  }
  try {
    const parsed = JSON.parse(textBlock.text) as {
      subject: string;
      html: string;
    };
    return { ...parsed, standalone };
  } catch {
    throw new Error("The AI email design was not valid. Please try again.");
  }
}

/* ------------------------------------------------------------------ */
/* STRUCTURED EMAIL MODEL (studio composer)                            */
/* ------------------------------------------------------------------ */

/**
 * The CONTENT fields of an EmailModel (everything the AI writes). The theme,
 * RSVP link, and photo are chosen in the studio, NOT by the AI, so swapping the
 * look never rewrites the words. `plan` is only for event/birthday occasions.
 */
export type EmailModelDraft = {
  subject: string;
  eyebrow?: string;
  heroTitle: string;
  heroSub?: string;
  greeting: string;
  intro: string;
  plan?: EmailPlan | null;
  closing: string;
};

const EMAIL_MODEL_SCHEMA = {
  type: "object",
  properties: {
    subject: {
      type: "string",
      description:
        "Short, warm, specific subject line (~4-8 words). No banned words. One tasteful emoji is fine for a party or holiday, otherwise none.",
    },
    eyebrow: {
      type: "string",
      description:
        "A very short caps line shown above the headline (e.g. \"You're invited\" or \"A note from Joy\"). 2-4 words. Leave empty to let the look supply one.",
    },
    heroTitle: {
      type: "string",
      description:
        "The big headline in the hero band. For a birthday, name the RESIDENT (\"Happy birthday, [resident's name]\"), never the recipient. Warm and specific, no banned words.",
    },
    heroSub: {
      type: "string",
      description:
        "An optional one-line italic subtitle under the headline (e.g. \"Cake, cards, and good company\"). Empty if not needed.",
    },
    greeting: {
      type: "string",
      description:
        "The salutation line. Greet the RECIPIENT with {{first_name}} (e.g. \"Hi {{first_name}},\"). One line only.",
    },
    intro: {
      type: "string",
      description:
        "Two or three short, warm sentences (the body of the note). Use \\n for a line break between short paragraphs. Specific detail over reassurance. This is the ONLY place the main message goes.",
    },
    plan: {
      type: ["object", "null"],
      description:
        "For an EVENT or BIRTHDAY only: the details card. Null for any other occasion. Never invent a date, time, or place: use a clear [bracketed placeholder] for anything the operator did not give.",
      properties: {
        when: {
          type: "string",
          description: "Date and time, e.g. \"Friday, September 26 at 3:00pm\" or \"[date and time]\" if not given.",
        },
        where: {
          type: "string",
          description: "The place, e.g. \"here at Joy\" or \"[location]\" if not given.",
        },
        treats: {
          type: "string",
          description: "An optional short line about food/activity, e.g. \"Cake and lemonade\". Empty string if none.",
        },
      },
      required: ["when", "where", "treats"],
      additionalProperties: false,
    },
    closing: {
      type: "string",
      description:
        "The warm sign-off, e.g. \"Warmly,\\n" + BUSINESS.director.name + " and the Joy team\". Use \\n between the sign-off line and the name. Name " + BUSINESS.director.name + " here.",
    },
  },
  required: ["subject", "eyebrow", "heroTitle", "heroSub", "greeting", "intro", "plan", "closing"],
  additionalProperties: false,
} as const;

function emailModelSystemPrompt(
  audience: EmailAudience,
  occasion: EmailOccasion
): string {
  const audienceBrief =
    audience === "families"
      ? `This email goes to the FAMILIES list (families of people who currently live at Joy). Community-wide only: parties, a family night, a monthly note, event photos, seasonal greetings. NEVER include details about an individual resident's care, and NEVER anything urgent (urgent news is a phone call). Warm, brief, inclusive of every family.`
      : `This email goes to the LEADS list (adult children researching senior living for a parent, usually a daughter in her 50s or 60s). A gentle, low-pressure, helpful note. It is fine to invite them to book a tour or call and ask for ${BUSINESS.director.name}, never pushy.`;

  return `You write the WORDS of a single email for ${BUSINESS.name}, a 24-bed personal care home in Loganville, Georgia, led by Executive Director ${BUSINESS.director.name}. You fill a small set of STRUCTURED FIELDS (subject, an eyebrow, a hero headline and optional subtitle, a greeting, the body, an optional details card, and a sign-off). You do NOT choose colors, fonts, or layout: a separate "look" is applied to your words, so write words that read well under any look.

${audienceBrief}

${occasionBrief(occasion)}

FIELD RULES:
- greeting: greet the RECIPIENT with {{first_name}} ("Hi {{first_name}},"). It is filled per person at send.
- intro: the whole message lives here, two or three short sentences (use \\n between short paragraphs). One concrete, specific detail beats general reassurance.
- plan: ONLY for an event or birthday. For every other occasion, set plan to null. Never invent a date, time, or place; use a [bracketed placeholder] for anything not given.
- heroTitle: for a birthday, name the RESIDENT (the celebrant), NEVER the recipient and NEVER {{first_name}}. Never invent, nickname, or shorten a name (no initials, no pet names); if no resident name is given, write "[resident's name]".
- closing: a warm sign-off naming ${BUSINESS.director.name} and the team.
- Do NOT write an unsubscribe line, a footer, or an address block; those are added automatically.

TWO RULES GOVERN EVERY WORD. They never bend.
VOICE (§2): NO em-dashes (use parentheses or commas). BANNED words (never use any): "loved ones", "vibrant", "journey", "personalized care plans", "boutique", "intimate" (say "small"), "top-tier", "deserve more", "embrace a life of". Short, warm, plainspoken sentences. Name ${BUSINESS.director.name} where care or leadership is discussed.
COMPLIANCE (§4) - Georgia license: Joy is a PERSONAL CARE HOME, NEVER "assisted living". You may reference "assisted living" ONLY as the category families search for, immediately followed by what Joy actually is. Allowed self-descriptions: "senior living", "personal care home", "memory care". Invent no specifics (dates, prices, quotes, resident stories); use [bracketed placeholders] instead.`;
}

/**
 * Draft (or revise) the structured content of a studio email. Returns only the
 * WORDS: the theme, RSVP link, and photo are applied separately, so a look swap
 * never rewrites copy. Pass `current` + `instruction` to make a targeted change
 * (Shorter, Warmer, a new subject, etc.) that keeps everything else intact.
 */
export async function draftEmailModel(input: {
  context: string;
  audience: EmailAudience;
  occasion: EmailOccasion;
  current?: EmailModelDraft | null;
  instruction?: string | null;
}): Promise<EmailModelDraft> {
  if (!aiEnabled()) {
    throw new Error("AI drafting is not configured (set ANTHROPIC_API_KEY).");
  }

  const editing = !!(input.current && input.instruction);
  const userPrompt = editing
    ? [
        `Here is the current email draft (as JSON fields):`,
        JSON.stringify(input.current, null, 2),
        ``,
        `Make ONLY this change, keeping every other field intact and in Joy's voice:`,
        input.instruction,
        ``,
        `Return all fields (changed and unchanged). Do not invent specifics; keep any [bracketed placeholders].`,
      ].join("\n")
    : [
        `Write the email. Here is what it is about, in the operator's words:`,
        input.context,
        ``,
        `Fill every field. Set plan to null unless this is an event or birthday. Use [bracketed placeholders] for any specific detail (a date, a time, a name) not given above.`,
      ].join("\n");

  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    thinking: { type: "adaptive" },
    system: emailModelSystemPrompt(input.audience, input.occasion),
    output_config: { format: { type: "json_schema", schema: EMAIL_MODEL_SCHEMA } },
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("The AI did not return an email draft.");
  }
  try {
    const parsed = JSON.parse(textBlock.text) as EmailModelDraft;
    // Normalize: an empty-string plan or an all-empty plan means "no details card".
    if (
      !parsed.plan ||
      (!parsed.plan.when?.trim() && !parsed.plan.where?.trim() && !parsed.plan.treats?.trim())
    ) {
      parsed.plan = null;
    }
    return parsed;
  } catch {
    throw new Error("The AI email draft was not valid. Please try again.");
  }
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
