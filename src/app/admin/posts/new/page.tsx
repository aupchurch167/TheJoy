import { requireAdmin } from "@/lib/require-admin";
import PostEditor from "../PostEditor";

export const dynamic = "force-dynamic";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ ai?: string }>;
}) {
  await requireAdmin();
  const { ai } = await searchParams;
  return <PostEditor aiStart={ai === "1"} />;
}
