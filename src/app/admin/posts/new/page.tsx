import { requireAdmin } from "@/lib/require-admin";
import PostEditor from "../PostEditor";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requireAdmin();
  return <PostEditor />;
}
