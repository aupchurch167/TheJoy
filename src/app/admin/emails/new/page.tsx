import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getAudienceSources } from "@/lib/leads";
import BroadcastComposer from "../BroadcastComposer";

export const dynamic = "force-dynamic";

export default async function NewEmailPage() {
  await requireAdmin();
  const sources = hasDatabase() ? await getAudienceSources("leads") : [];
  return <BroadcastComposer sources={sources} />;
}
