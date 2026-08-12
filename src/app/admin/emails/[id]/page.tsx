import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getBroadcastById } from "@/lib/broadcasts";
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
  const sources = hasDatabase() ? await getAudienceSources("leads") : [];
  return <BroadcastComposer broadcast={broadcast} sources={sources} />;
}
