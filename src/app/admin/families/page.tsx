import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getFamilyMembers, countFamiliesTextable } from "@/lib/leads";
import FamilyManager from "./FamilyManager";
import { PageHeader, NotConnected } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function FamiliesPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Family list" />
        <NotConnected what="The family list" />
      </>
    );
  }

  const [members, textableCount] = await Promise.all([
    getFamilyMembers(),
    countFamiliesTextable(),
  ]);

  return <FamilyManager members={members} textableCount={textableCount} />;
}
