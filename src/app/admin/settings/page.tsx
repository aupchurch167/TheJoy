import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getAllSettings } from "@/lib/settings";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SiteSettingsPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Site settings
        </h1>
        <p className="mt-4 rounded-lg bg-clay/10 px-4 py-3 text-clay-dark">
          The database is not connected yet.
        </p>
      </div>
    );
  }

  const settings = await getAllSettings();

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Site settings
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Values used across the site (contact facts, the Careers link, the tour
        link). Editing here updates the live site within a moment. The Careers
        link only shows when a link is set.
      </p>
      <div className="mt-6">
        <SettingsForm initial={settings} />
      </div>
    </div>
  );
}
