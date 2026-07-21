import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getFamilyMembers } from "@/lib/leads";
import FamilyManager from "./FamilyManager";

export const dynamic = "force-dynamic";

export default async function FamiliesPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Family list
        </h1>
        <p className="mt-4 rounded-lg bg-clay/10 px-4 py-3 text-clay-dark">
          The database is not connected yet.
        </p>
      </div>
    );
  }

  const members = await getFamilyMembers();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Family list
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Current residents&apos; families who receive community emails
        (invitations, a monthly note from Mellissa, event photos). To email them,
        go to{" "}
        <Link href="/admin/emails/new" className="text-clay hover:underline">
          Emails
        </Link>{" "}
        and choose the Families audience.
      </p>

      <div className="mt-4 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-ink-soft">
        <strong className="text-ink">Community-wide only.</strong> These emails
        are for the whole family list: parties, family nights, a monthly note,
        photos. Never send individual resident details or anything urgent by
        email. Anything about one resident&apos;s health or an emergency stays a
        phone call.
      </div>

      <div className="mt-6">
        <FamilyManager members={members} />
      </div>
    </div>
  );
}
