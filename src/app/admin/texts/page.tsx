import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getSmsRecipients } from "@/lib/leads";
import { getSmsBroadcasts } from "@/lib/broadcasts";
import { smsEnabled, parseSmsNumbers } from "@/lib/sms";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/format";
import {
  PageHeader,
  Badge,
  EmptyState,
  NotConnected,
  SectionLabel,
} from "@/components/admin/ui";
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
    <>
      <PageHeader
        title="Texts"
        description="Send a short text to families who have opted in (via Quo). For quick, community-wide notes: a reminder, a weather closing, an event today."
      />

      {!enabled && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          <span aria-hidden>⚠️</span>
          <div>
            <p className="font-medium text-ink">Texting isn&apos;t set up yet.</p>
            <p className="mt-1">
              Add <code>QUO_API_KEY</code> and <code>QUO_FROM_NUMBER</code> in
              Railway, and register the number for A2P texting in Quo. Until then
              you can write a message, but sending is off (see OPERATIONS.md).
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-clay/30 bg-clay/5 px-4 py-3 text-sm text-ink-soft">
        <span aria-hidden>📋</span>
        <p>
          <strong className="text-ink">Consent required.</strong> Texts only go
          to family contacts you&apos;ve marked <strong>Texts: on</strong> in the{" "}
          <Link href="/admin/families" className="font-medium text-clay hover:text-clay-dark">
            Family list
          </Link>
          . Only opt in people who agreed to be texted. Every message adds
          &ldquo;Reply STOP to opt out.&rdquo; automatically.
        </p>
      </div>

      <TextComposer
        enabled={enabled}
        recipientCount={recipients.length}
        testNumberCount={testNumberCount}
      />

      <div className="mt-10">
        <SectionLabel>Recent texts</SectionLabel>
        <div className="mt-3">
          {recent.length === 0 ? (
            <EmptyState
              icon="💬"
              title="No texts sent yet"
              description="Your text blasts will show up here with how many families received them."
            />
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-sm">
              {recent.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-ink">{b.body}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {b.sent_at ? formatDateTime(b.sent_at) : "—"}
                    </p>
                  </div>
                  <Badge tone="success">Sent to {b.sent_count}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
