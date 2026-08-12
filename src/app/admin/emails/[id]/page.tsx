import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import {
  getBroadcastById,
  getBroadcastResults,
  listSavedSegments,
} from "@/lib/broadcasts";
import { getAudienceSources } from "@/lib/leads";
import BroadcastComposer from "../BroadcastComposer";

export const dynamic = "force-dynamic";

export default async function EditEmailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const broadcast = await getBroadcastById(id);
  if (!broadcast) notFound();
  const db = hasDatabase();
  const sources = db ? await getAudienceSources("leads") : [];
  const segments = db ? await listSavedSegments() : [];
  const results =
    db && broadcast.status === "sent"
      ? await getBroadcastResults(broadcast.id)
      : null;
  return (
    <BroadcastComposer
      broadcast={broadcast}
      sources={sources}
      segments={segments}
      results={results}
    />
  );
}
