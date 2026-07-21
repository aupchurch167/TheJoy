import { query } from "./db";

export type PostStatus = "draft" | "published";

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  hero_image: string | null;
  hero_image_alt: string | null;
  author: string;
  category: string | null;
  status: PostStatus;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PostInput = {
  slug: string;
  title: string;
  excerpt?: string | null;
  body?: string;
  hero_image?: string | null;
  hero_image_alt?: string | null;
  author?: string;
  category?: string | null;
  status?: PostStatus;
  meta_title?: string | null;
  meta_description?: string | null;
};

/** Make a URL-safe slug from a title. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/* ---------------- Public reads (published only) ---------------- */

export async function getPublishedPosts(limit?: number): Promise<Post[]> {
  const rows = await query<Post>(
    `SELECT * FROM posts
      WHERE status = 'published' AND published_at IS NOT NULL
      ORDER BY published_at DESC
      ${limit ? "LIMIT $1" : ""}`,
    limit ? [limit] : []
  );
  return rows;
}

export async function getPublishedPostBySlug(
  slug: string
): Promise<Post | null> {
  const rows = await query<Post>(
    `SELECT * FROM posts
      WHERE slug = $1 AND status = 'published' AND published_at IS NOT NULL
      LIMIT 1`,
    [slug]
  );
  return rows[0] ?? null;
}

/* ---------------- Admin reads (all statuses) ---------------- */

export async function getAllPosts(): Promise<Post[]> {
  return query<Post>(`SELECT * FROM posts ORDER BY updated_at DESC`);
}

export async function getPostById(id: string): Promise<Post | null> {
  const rows = await query<Post>(`SELECT * FROM posts WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function slugExists(
  slug: string,
  exceptId?: string
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM posts WHERE slug = $1 ${exceptId ? "AND id <> $2" : ""}`,
    exceptId ? [slug, exceptId] : [slug]
  );
  return rows.length > 0;
}

/* ---------------- Writes ---------------- */

export async function createPost(input: PostInput): Promise<Post> {
  const publishedAt =
    input.status === "published" ? new Date().toISOString() : null;
  const rows = await query<Post>(
    `INSERT INTO posts
       (slug, title, excerpt, body, hero_image, hero_image_alt, author,
        category, status, meta_title, meta_description, published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      input.slug,
      input.title,
      input.excerpt ?? null,
      input.body ?? "",
      input.hero_image ?? null,
      input.hero_image_alt ?? null,
      input.author ?? "Joy Senior Living",
      input.category ?? null,
      input.status ?? "draft",
      input.meta_title ?? null,
      input.meta_description ?? null,
      publishedAt,
    ]
  );
  return rows[0];
}

export async function updatePost(
  id: string,
  input: PostInput
): Promise<Post | null> {
  // Set published_at the first time a post becomes published; keep it after.
  const existing = await getPostById(id);
  if (!existing) return null;

  let publishedAt = existing.published_at;
  if (input.status === "published" && !existing.published_at) {
    publishedAt = new Date().toISOString();
  }
  if (input.status === "draft") {
    // Unpublishing hides it again but we keep the original date for reference.
    publishedAt = existing.published_at;
  }

  const rows = await query<Post>(
    `UPDATE posts SET
       slug = $2, title = $3, excerpt = $4, body = $5, hero_image = $6,
       hero_image_alt = $7, author = $8, category = $9, status = $10,
       meta_title = $11, meta_description = $12, published_at = $13,
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      input.slug,
      input.title,
      input.excerpt ?? null,
      input.body ?? "",
      input.hero_image ?? null,
      input.hero_image_alt ?? null,
      input.author ?? "Joy Senior Living",
      input.category ?? null,
      input.status ?? "draft",
      input.meta_title ?? null,
      input.meta_description ?? null,
      publishedAt,
    ]
  );
  return rows[0] ?? null;
}

export async function deletePost(id: string): Promise<void> {
  await query(`DELETE FROM posts WHERE id = $1`, [id]);
}
