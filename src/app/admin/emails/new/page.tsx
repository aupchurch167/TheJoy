import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getAudienceSources } from "@/lib/leads";
import { listSavedSegments } from "@/lib/broadcasts";
import BroadcastComposer from "../BroadcastComposer";

export const dynamic = "force-dynamic";

export default async function NewEmailPage() {
  await requireAdmin();
  const db = hasDatabase();
  const sources = db ? await getAudienceSources("leads") : [];
  const segments = db ? await listSavedSegments() : [];
  return <BroadcastComposer sources={sources} segments={segments} />;
}
