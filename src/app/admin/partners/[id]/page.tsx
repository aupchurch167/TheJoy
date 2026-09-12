import { notFound } from "next/navigation";
import { PageHeader, NotConnected } from "@/components/admin/ui";
import { hasDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import {
  getPartner,
  getActivities,
  getReminders,
  getReferrals,
  listPartnerIds,
} from "@/lib/partners";
import PartnerDetailClient from "./PartnerDetailClient";

export const dynamic = "force-dynamic";

type SP = {
  q?: string;
  status?: string;
  tier?: string;
  category?: string;
  owner?: string;
  due?: string;
};

export default async function PartnerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SP>;
}) {
  const { email } = await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Partner" />
        <NotConnected what="This partner" />
      </>
    );
  }

  const partner = await getPartner(id);
  if (!partner) notFound();

  const [activities, reminders, referrals, orderedIds] = await Promise.all([
    getActivities(id),
    getReminders(id),
    getReferrals(id),
    listPartnerIds({
      q: sp.q,
      status: sp.status,
      tier: sp.tier,
      category: sp.category,
      owner: sp.owner,
      due: sp.due === "1",
    }),
  ]);

  // Carry the list's filters back to the list link and prev/next pager.
  const listQs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v) listQs.set(k, v);
  const listSuffix = listQs.toString() ? `?${listQs.toString()}` : "";

  const index = orderedIds.indexOf(id);
  const detailHref = (pid: string) => `/admin/partners/${pid}${listSuffix}`;
  const prevHref = index > 0 ? detailHref(orderedIds[index - 1]) : null;
  const nextHref =
    index >= 0 && index < orderedIds.length - 1
      ? detailHref(orderedIds[index + 1])
      : null;

  return (
    <PartnerDetailClient
      partner={partner}
      activities={activities}
      reminders={reminders}
      referrals={referrals}
      currentUser={email}
      backHref={`/admin/partners${listSuffix}`}
      prevHref={prevHref}
      nextHref={nextHref}
      position={index >= 0 ? index + 1 : null}
      total={orderedIds.length}
    />
  );
}
