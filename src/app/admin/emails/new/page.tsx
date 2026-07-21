import { requireAdmin } from "@/lib/require-admin";
import BroadcastComposer from "../BroadcastComposer";

export const dynamic = "force-dynamic";

export default async function NewEmailPage() {
  await requireAdmin();
  return <BroadcastComposer />;
}
