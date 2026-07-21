import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { getPostById } from "@/lib/posts";
import PostEditor from "../PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();
  return <PostEditor post={post} />;
}
