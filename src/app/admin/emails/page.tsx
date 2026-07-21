import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getAllBroadcasts } from "@/lib/broadcasts";
import { emailEnabled } from "@/lib/email";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-line/70 text-ink-faint",
  scheduled: "bg-gold/15 text-gold",
  sending: "bg-gold/15 text-gold",
  sent: "bg-sage/15 text-sage",
};

export default async function EmailsPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-display text-2xl font-semibold text-ink">Emails</h1>
        <p className="mt-4 rounded-lg bg-clay/10 px-4 py-3 text-clay-dark">
          The database is not connected yet.
        </p>
      </div>
    );
  }

  const broadcasts = await getAllBroadcasts();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Emails</h1>
        <Link
          href="/admin/emails/new"
          className="rounded-full bg-clay px-4 py-2 text-sm font-semibold text-white hover:bg-clay-dark"
        >
          New email
        </Link>
      </div>
      <p className="mb-6 text-sm text-ink-soft">
        One-off notes to the leads audience. New leads also get an automatic
        nurture drip (welcome, what makes Joy different, a family story, a tour
        invitation).
      </p>

      {!emailEnabled() && (
        <p className="mb-6 rounded-lg bg-gold/10 px-4 py-3 text-sm text-gold">
          Email is not configured yet (RESEND_API_KEY). You can compose and save
          drafts, but sending is off until it is set (see OPERATIONS.md).
        </p>
      )}

      {broadcasts.length === 0 ? (
        <p className="rounded-lg border border-line bg-white px-5 py-8 text-center text-ink-soft">
          No emails yet.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white">
          {broadcasts.map((b) => (
            <li key={b.id}>
              <Link
                href={`/admin/emails/${b.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-paper"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">
                    {b.subject || "(no subject)"}
                  </span>
                  <span className="block text-sm text-ink-faint">
                    {b.status === "sent"
                      ? `Sent to ${b.sent_count}`
                      : b.status === "scheduled"
                        ? `Scheduled ${b.scheduled_at ? new Date(b.scheduled_at).toLocaleString() : ""}`
                        : "Draft"}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[b.status]}`}
                >
                  {b.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
