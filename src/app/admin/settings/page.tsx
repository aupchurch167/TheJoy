import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getAllSettings } from "@/lib/settings";
import SettingsForm from "./SettingsForm";
import { PageHeader, NotConnected } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function SiteSettingsPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Site settings" />
        <NotConnected what="Site settings" />
      </>
    );
  }

  const settings = await getAllSettings();

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Site settings"
        description="Values used across the public site: contact facts, the Careers and tour links, the homepage headline, and the promotion banner. Editing here updates the live site within a moment."
      />
      <SettingsForm initial={settings} />
    </div>
  );
}
