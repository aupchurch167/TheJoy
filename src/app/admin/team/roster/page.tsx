import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { listEmployees } from "@/lib/employees";
import { PageHeader, BackLink, NotConnected } from "@/components/admin/ui";
import RosterManager from "./RosterManager";

export const dynamic = "force-dynamic";

export default async function RosterPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Team roster" />
        <NotConnected what="The roster" />
      </>
    );
  }

  const employees = await listEmployees();

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <BackLink href="/admin/team">Team feedback</BackLink>
      </div>
      <PageHeader
        title="Team roster"
        description="The staff who receive pulse surveys. Add people by hand or paste a CSV."
      />
      <RosterManager employees={employees} />
    </div>
  );
}
