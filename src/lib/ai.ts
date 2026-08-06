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
/* EMAIL DRAFTING                                                       */
/* ------------------------------------------------------------------ */

export type EmailAudience = "leads" | "families";

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

function emailSystemPrompt(audience: EmailAudience): string {
  const audienceBrief =
    audience === "families"
      ? `This email goes to the FAMILIES list (the families of people who currently live at Joy). It must be COMMUNITY-WIDE only: parties, a family night, a monthly note, event photos, seasonal greetings. NEVER include details about an individual resident, and NEVER anything urgent (urgent news is always a phone call, never an email). Warm, brief, and inclusive of every family.`
      : `This email goes to the LEADS list (adult children researching senior living for a parent, usually a daughter in her 50s or 60s). It is a gentle nurture note: honest, low-pressure, and helpful. It is fine to invite them to book a tour or call and ask for ${BUSINESS.director.name}, but never pushy.`;

  return `You are writing a short email on behalf of ${BUSINESS.name}, a 24-bed personal care home in Loganville, Georgia, led by Executive Director ${BUSINESS.director.name}.

${audienceBrief}

TWO RULES GOVERN EVERY WORD. They never bend.

VOICE (§2):
- NO em-dashes. Use parentheses for asides.
- BANNED words and phrases (never use any): "loved ones", "vibrant", "journey", "personalized care plans", "boutique", "intimate" (say "small"), "top-tier", "deserve more", "embrace a life of".
- Short sentences. Plainspoken, warm, honest, never sales-y. Prose, not bullet lists.
- Name ${BUSINESS.director.name} where care or leadership is discussed.

COMPLIANCE (§4) - Georgia license (a legal boundary):
- Joy is a PERSONAL CARE HOME, NOT assisted living. NEVER call Joy "assisted living". You may reference "assisted living" ONLY as the category families search for, immediately followed by what Joy actually is (a personal care home).
- Allowed self-descriptions: "senior living", "personal care home", "memory care".
- NEVER fabricate specifics: no invented dates, times, prices, statistics, quotes, or resident stories. Use ONLY the details the operator provides in their context. If a specific (a date, an RSVP link, a price) is needed but not given, write a clear placeholder in [square brackets] for the operator to fill in, rather than inventing it.

Keep the whole email short: a subject line plus a few short paragraphs in Markdown. Do not add an unsubscribe link, a "Joy Senior Living" signature, or an address block; those are appended automatically.`;
}

export async function draftEmail(
  context: string,
  audience: EmailAudience
): Promise<EmailDraft> {
  if (!aiEnabled()) {
    throw new Error("AI drafting is not configured (set ANTHROPIC_API_KEY).");
  }

  const client = new Anthropic();

  const userPrompt = [
    `Write an email. Here is what it should be about, in the operator's words:`,
    context,
    `Remember: Joy's voice, personal care home (never "assisted living" for Joy), no banned words, no em-dashes, and invent no specifics (use [placeholders] for any detail not given above).`,
  ].join("\n\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    system: emailSystemPrompt(audience),
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
