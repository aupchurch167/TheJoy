/**
 * Suggested hero-image prompt for the blog editor. Pure string building, so it
 * is safe to import in the client editor. It leans toward warm, editorial,
 * atmosphere-first imagery (light, hands, a porch, a table) rather than
 * fabricated "photos" of Joy, real residents, staff, or branding. Generated
 * images are illustrations, not real photos of the home (see the editor note).
 *
 * Business facts are the single-source ones from src/lib/site.ts, repeated here
 * only so the client bundle does not pull in that whole module.
 */
const BUSINESS_NAME = "Joy Senior Living";
const CITY = "Loganville, Georgia";

export function suggestHeroPrompt(fields: {
  title?: string;
  excerpt?: string;
  category?: string;
}): string {
  const topic = (
    fields.title ||
    fields.category ||
    "senior living and caring for a parent"
  ).trim();

  return `An editorial, photorealistic hero image for a blog post about "${topic}" for ${BUSINESS_NAME}, a small personal care home in ${CITY}. Warm morning light and a calm, hopeful mood. Something atmospheric rather than staged: a sunlit front porch with rocking chairs, a cup of coffee on a wooden kitchen table, a garden in soft focus, or the hands of an older person and an adult child resting together. Documentary style, natural tones, gentle depth of field. No text, no words, no logos, no signage.`;
}

/** A reasonable default alt line for a generated hero, editable by the author. */
export function defaultHeroAlt(fields: { title?: string }): string {
  const t = (fields.title || "").trim();
  return t
    ? `Illustration for “${t}”`
    : "Illustration for a Joy Senior Living blog post";
}
