import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { getBroadcastById } from "@/lib/broadcasts";
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
  return <BroadcastComposer broadcast={broadcast} />;
}
