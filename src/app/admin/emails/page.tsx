import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getAllBroadcasts } from "@/lib/broadcasts";
import { emailEnabled } from "@/lib/email";
import { formatDateTime } from "@/lib/format";
import {
  PageHeader,
  ButtonLink,
  Badge,
  EmptyState,
  NotConnected,
  type BadgeTone,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, BadgeTone> = {
  draft: "neutral",
  scheduled: "warning",
  sending: "warning",
  sent: "success",
};

export default async function EmailsPage() {
  await requireAdmin();

  const newAction = (
    <ButtonLink href="/admin/emails/new" size="sm">
      New email
    </ButtonLink>
  );

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Emails" />
        <NotConnected what="Emails" />
      </>
    );
  }

  const broadcasts = await getAllBroadcasts();

  return (
    <>
      <PageHeader
        title="Emails"
        description="One-off notes to your leads or families. New leads also get an automatic nurture drip (welcome, what makes Joy different, a family story, a tour invitation)."
        actions={newAction}
      />

      {!emailEnabled() && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          <span aria-hidden>⚠️</span>
          <p>
            Email sending is off until <code>RESEND_API_KEY</code> is set. You
            can compose and save drafts now (see OPERATIONS.md).
          </p>
        </div>
      )}

      {broadcasts.length === 0 ? (
        <EmptyState
          icon="✉️"
          title="No emails yet"
          description="Compose a note to your leads or families. You can preview it, then send now or schedule it."
          action={
            <ButtonLink href="/admin/emails/new" variant="primary">
              New email
            </ButtonLink>
          }
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-sm">
          {broadcasts.map((b) => (
            <li key={b.id}>
              <Link
                href={`/admin/emails/${b.id}`}
                className="flex min-h-16 cursor-pointer items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">
                    {b.subject || "(no subject)"}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-ink-faint">
                    {b.audience === "families" ? "Families" : "Leads"} ·{" "}
                    {b.status === "sent"
                      ? `Sent to ${b.sent_count}`
                      : b.status === "scheduled"
                        ? `Scheduled ${formatDateTime(b.scheduled_at)}`
                        : "Draft"}
                  </span>
                </span>
                <Badge tone={STATUS_TONE[b.status] ?? "neutral"}>
                  {b.status}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
