import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getSmsRecipients } from "@/lib/leads";
import { getSmsBroadcasts } from "@/lib/broadcasts";
import { smsEnabled, parseSmsNumbers } from "@/lib/sms";
import { getSettings } from "@/lib/settings";
import { PageHeader, NotConnected } from "@/components/admin/ui";
import TextComposer from "./TextComposer";

export const dynamic = "force-dynamic";

export default async function TextsPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Texts" />
        <NotConnected what="Text blasts" />
      </>
    );
  }

  const [recipients, recent, settings] = await Promise.all([
    getSmsRecipients(),
    getSmsBroadcasts(),
    getSettings(),
  ]);
  const enabled = smsEnabled();
  const testNumberCount = parseSmsNumbers(settings.sms_test_numbers).length;

  return (
    <TextComposer
      enabled={enabled}
      recipientCount={recipients.length}
      testNumberCount={testNumberCount}
      recent={recent.map((b) => ({
        id: b.id,
        body: b.body,
        sent_at: b.sent_at,
        sent_count: b.sent_count,
      }))}
    />
  );
}
