import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import {
  getAllBroadcasts,
  countNonOpeners,
  sentCountForBroadcast,
} from "@/lib/broadcasts";
import { countSubscribers } from "@/lib/leads";
import { isWithinSendWindow, throttleSummary } from "@/lib/broadcast-runner";
import { emailEnabled } from "@/lib/email";
import { formatDateTime } from "@/lib/format";
import {
  PageHeader,
  ButtonLink,
  Badge,
  EmptyState,
  NotConnected,
  SectionLabel,
} from "@/components/admin/ui";
import EmailQueue, { type QueueItem } from "./EmailQueue";

export const dynamic = "force-dynamic";

/** Due = no schedule set, or its time has passed. Kept out of render (Date.now). */
function isDueNow(iso: string | null): boolean {
  return !iso || new Date(iso).getTime() <= Date.now();
}

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
  const queued = broadcasts.filter(
    (b) => b.channel === "email" && (b.status === "scheduled" || b.status === "sending")
  );
  const drafts = broadcasts.filter((b) => b.channel === "email" && b.status === "draft");
  const sent = broadcasts.filter((b) => b.channel === "email" && b.status === "sent");

  const queueItems: QueueItem[] = await Promise.all(
    queued.map(async (b) => {
      const expected = b.resend_of
        ? await countNonOpeners(b.resend_of)
        : await countSubscribers(b.audience, b.filters ?? undefined);
      return {
        id: b.id,
        subject: b.subject,
        audience: b.audience as "leads" | "families",
        status: b.status as "scheduled" | "sending",
        scheduledAt: b.scheduled_at,
        expected,
        sentSoFar: await sentCountForBroadcast(b.id),
        priority: b.priority,
        isResend: !!b.resend_of,
        dueNow: isDueNow(b.scheduled_at),
      };
    })
  );
  // Priority first, then soonest scheduled.
  queueItems.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority ? -1 : 1;
    const at = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
    const bt = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
    return at - bt;
  });

  const empty = broadcasts.filter((b) => b.channel === "email").length === 0;

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
            Email sending is off until <code>RESEND_API_KEY</code> is set. Anything
            you send now stays queued and goes out once it&apos;s configured (see
            OPERATIONS.md).
          </p>
        </div>
      )}

      <EmailQueue
        items={queueItems}
        withinWindow={isWithinSendWindow()}
        throttle={throttleSummary()}
      />

      {empty ? (
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
        <>
          {drafts.length > 0 && (
            <section className="mb-8">
              <SectionLabel>Drafts</SectionLabel>
              <ul className="mt-2.5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-sm">
                {drafts.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/admin/emails/${b.id}`}
                      className="flex min-h-14 items-center justify-between gap-4 px-5 py-3.5 hover:bg-surface"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">
                          {b.subject || "(no subject)"}
                        </span>
                        <span className="mt-0.5 block text-sm text-ink-faint">
                          {b.audience === "families" ? "Families" : "Leads"} · Draft
                        </span>
                      </span>
                      <Badge tone="neutral">draft</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {sent.length > 0 && (
            <section>
              <SectionLabel>Sent</SectionLabel>
              <ul className="mt-2.5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-sm">
                {sent.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/admin/emails/${b.id}`}
                      className="flex min-h-14 items-center justify-between gap-4 px-5 py-3.5 hover:bg-surface"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">
                          {b.subject || "(no subject)"}
                        </span>
                        <span className="mt-0.5 block text-sm text-ink-faint">
                          {b.audience === "families" ? "Families" : "Leads"} · Sent to{" "}
                          {b.sent_count}
                          {b.sent_at ? ` · ${formatDateTime(b.sent_at)}` : ""}
                        </span>
                      </span>
                      <Badge tone="success">sent</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
