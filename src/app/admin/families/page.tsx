import Link from "next/link";
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

  return (
    <>
      <PageHeader
        title="Family list"
        description={
          <>
            Your residents&apos; families, by resident. Community emails
            (invitations, a monthly note from Mellissa, event photos) reach only{" "}
            <strong>active</strong> residents&apos; families who have an email.
            To email them, go to{" "}
            <Link href="/admin/emails/new" className="font-medium text-clay hover:text-clay-dark">
              Emails
            </Link>{" "}
            and choose the Families audience.
          </>
        }
      />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-ink-soft">
        <span aria-hidden>⚠️</span>
        <p>
          <strong className="text-ink">Community-wide only.</strong> These emails
          are for the whole family list: parties, family nights, a monthly note,
          photos. Never send individual resident details or anything urgent by
          email. Anything about one resident&apos;s health or an emergency stays a
          phone call.
        </p>
      </div>

      <FamilyManager members={members} textableCount={textableCount} />
    </>
  );
}
