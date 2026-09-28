/**
 * Pick 3 or 4 other published posts for the "Related reading" block.
 *
 * Score is category match plus overlapping words in the title and slug, so a
 * cost post points at other cost posts and a dementia post points at other
 * dementia posts. Ties break on a stable mix of the two slugs, so posts that
 * share a category do not all link the same three newest stories.
 */

const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "to",
  "of",
  "for",
  "in",
  "on",
  "at",
  "with",
  "your",
  "our",
  "how",
  "what",
  "when",
  "who",
  "is",
  "it",
  "its",
  "from",
  "by",
  "be",
  "this",
  "that",
  "as",
  "we",
  "you",
  "their",
  "about",
  "joy",
  "senior",
  "living",
  "care",
  "home",
  "parent",
  "parents",
  "mom",
  "dad",
  "loganville",
  "georgia",
  "ga",
]);

export type RelatedPost = {
  slug: string;
  title: string;
  category?: string | null;
};

function tokens(post: RelatedPost): Set<string> {
  const raw = `${post.title} ${post.slug}`.toLowerCase();
  const out = new Set<string>();
  for (const part of raw.split(/[^a-z0-9]+/)) {
    if (part.length < 3 || STOP.has(part)) continue;
    out.add(part);
  }
  return out;
}

function mix(a: string, b: string): number {
  let h = 0;
  const s = `${a}\0${b}`;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

export function pickRelatedPosts<T extends RelatedPost>(
  current: T,
  posts: T[],
  count = 4
): T[] {
  const mine = tokens(current);
  const others = posts.filter((p) => p.slug !== current.slug);
  const ranked = others.map((post) => {
    const theirs = tokens(post);
    let overlap = 0;
    for (const token of mine) {
      if (theirs.has(token)) overlap += 1;
    }
    const sameCategory =
      current.category && post.category && current.category === post.category
        ? 4
        : 0;
    return { post, score: sameCategory + overlap, tie: mix(current.slug, post.slug) };
  });
  ranked.sort((a, b) => b.score - a.score || a.tie - b.tie);
  const take = Math.min(count, ranked.length);
  // 3 when we have at least 3 others and were asked for more than 3 but fewer
  // than 3 exist is just "all of them". Callers ask for 4.
  return ranked.slice(0, take).map((row) => row.post);
}
