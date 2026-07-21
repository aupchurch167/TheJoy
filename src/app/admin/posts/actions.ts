"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import {
  createPost,
  updatePost,
  deletePost,
  slugExists,
  slugify,
  type PostStatus,
} from "@/lib/posts";

const PostSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "A title is required.").max(200),
  slug: z.string().trim().max(80).optional(),
  excerpt: z.string().trim().max(400).optional(),
  body: z.string().max(100000).optional(),
  hero_image: z.string().trim().max(1000).optional(),
  hero_image_alt: z.string().trim().max(300).optional(),
  category: z.string().trim().max(80).optional(),
  meta_title: z.string().trim().max(200).optional(),
  meta_description: z.string().trim().max(400).optional(),
  status: z.enum(["draft", "published"]),
});

export type SaveResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string };

export async function savePost(input: unknown): Promise<SaveResult> {
  await requireAdmin();

  const parsed = PostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  }
  const data = parsed.data;

  // Slug: use provided, else derive from title. Ensure uniqueness.
  let slug = data.slug ? slugify(data.slug) : slugify(data.title);
  if (!slug) return { ok: false, error: "Could not make a URL from the title." };
  if (await slugExists(slug, data.id)) {
    // Append a short suffix until unique.
    let n = 2;
    while (await slugExists(`${slug}-${n}`, data.id)) n++;
    slug = `${slug}-${n}`;
  }

  const payload = {
    slug,
    title: data.title,
    excerpt: data.excerpt || null,
    body: data.body ?? "",
    hero_image: data.hero_image || null,
    hero_image_alt: data.hero_image_alt || null,
    category: data.category || null,
    meta_title: data.meta_title || null,
    meta_description: data.meta_description || null,
    status: data.status as PostStatus,
  };

  try {
    const post = data.id
      ? await updatePost(data.id, payload)
      : await createPost(payload);
    if (!post) return { ok: false, error: "Post not found." };

    // Refresh public + admin caches.
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/admin");

    return { ok: true, id: post.id, slug: post.slug };
  } catch (err) {
    console.error("[savePost]", err);
    return { ok: false, error: "Could not save. Is the database connected?" };
  }
}

export async function removePost(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await deletePost(id);
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    console.error("[removePost]", err);
    return { ok: false };
  }
}
