import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { paypalEnabled, paypalMode } from "@/lib/paypal";
import { emailEnabled } from "@/lib/email";
import { smsEnabled } from "@/lib/sms";
import { BUSINESS } from "@/lib/site";
import {
  listDepositRequests,
  countArchivedDeposits,
  formatMoney,
  isCancelable,
} from "@/lib/deposits";
import {
  PageHeader,
  NotConnected,
  Card,
  Badge,
  TableWrap,
  Th,
  Td,
  EmptyState,
  type BadgeTone,
} from "@/components/admin/ui";
import DepositForm from "./DepositForm";
import DepositRowActions from "./DepositRowActions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, BadgeTone> = {
  paid: "success",
  partially_paid: "warning",
  sent: "info",
  draft: "neutral",
  cancelled: "danger",
  refunded: "warning",
};

function statusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function DepositsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Deposits" />
        <NotConnected what="Deposits" />
      </>
    );
  }

  const { view } = await searchParams;
  const showArchived = view === "archived";

  const [settings, deposits, archivedCount] = await Promise.all([
    getSettings(),
    listDepositRequests({ archived: showArchived }),
    countArchivedDeposits(),
  ]);
  const enabled = paypalEnabled();
  const emailReady = emailEnabled();
  const smsReady = smsEnabled();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Deposits"
        description={`Send a move-in deposit request. We email the family a secure payment link from ${BUSINESS.email}; PayPal hosts the payment page and tracks whether it is paid. Payments go straight to your PayPal account.`}
      />

      {!enabled && (
        <Card className="mb-6 border-gold/40 bg-gold/5">
          <p className="text-sm font-semibold text-ink">
            PayPal is not connected yet.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            Add <code>PAYPAL_CLIENT_ID</code> and <code>PAYPAL_CLIENT_SECRET</code>{" "}
            in Railway (Variables), then redeploy. Leave <code>PAYPAL_ENV</code>{" "}
            unset to test in sandbox first, or set it to <code>live</code> to take
            real payments. See OPERATIONS.md for the step-by-step.
          </p>
        </Card>
      )}

      {enabled && !emailReady && (
        <Card className="mb-6 border-gold/40 bg-gold/5">
          <p className="text-sm font-semibold text-ink">
            Email sending is off, so the family will not be emailed.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            The invoice is still created and you can copy its payment link from
            the row menu (<strong>View invoice</strong>). To have the request
            emailed from <code>{BUSINESS.email}</code> automatically, set{" "}
            <code>RESEND_API_KEY</code> in Railway (see OPERATIONS.md).
          </p>
        </Card>
      )}

      {enabled && (
        <p className="mb-4 text-xs text-ink-faint">
          Mode:{" "}
          <Badge tone={paypalMode() === "live" ? "success" : "warning"}>
            {paypalMode() === "live" ? "Live (real payments)" : "Sandbox (test)"}
          </Badge>
        </p>
      )}

      <DepositForm
        enabled={enabled}
        defaultAmount={settings.deposit_amount}
        defaultNote={settings.deposit_note}
      />

      <div className="mt-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">
            {showArchived ? "Archived" : "History"}
          </h2>
          {/* Active / Archived toggle */}
          <div className="flex items-center gap-1 text-sm">
            <Link
              href="/admin/deposits"
              className={`rounded-lg px-3 py-1.5 font-medium ${
                showArchived
                  ? "text-ink-soft hover:bg-surface"
                  : "bg-clay/10 text-clay"
              }`}
            >
              Active
            </Link>
            <Link
              href="/admin/deposits?view=archived"
              className={`rounded-lg px-3 py-1.5 font-medium ${
                showArchived
                  ? "bg-clay/10 text-clay"
                  : "text-ink-soft hover:bg-surface"
              }`}
            >
              Archived{archivedCount > 0 ? ` (${archivedCount})` : ""}
            </Link>
          </div>
        </div>

        {deposits.length === 0 ? (
          <EmptyState
            icon="💳"
            title={showArchived ? "Nothing archived" : "No deposit requests yet"}
            description={
              showArchived
                ? "Requests you archive will appear here. You can restore them anytime."
                : "Deposit requests you send will appear here with their payment status."
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr className="border-b border-line">
                <Th>Family</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Sent</Th>
                <Th>Paid</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d.id} className="border-b border-line last:border-0">
                  <Td>
                    <div className="font-medium text-ink">{d.recipient_name}</div>
                    <div className="text-xs text-ink-faint">
                      {d.recipient_email}
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap font-medium text-ink">
                    {formatMoney(d.amount_cents, d.currency)}
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[d.status] ?? "neutral"}>
                      {statusLabel(d.status)}
                    </Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-ink-soft">
                    {formatDate(d.created_at)}
                  </Td>
                  <Td className="whitespace-nowrap text-ink-soft">
                    {formatDate(d.paid_at)}
                  </Td>
                  <Td>
                    <DepositRowActions
                      id={d.id}
                      invoiceUrl={d.invoice_url}
                      hasPhone={!!d.recipient_phone}
                      archived={!!d.archived_at}
                      cancelable={isCancelable(d.status)}
                      emailReady={emailReady}
                      smsReady={smsReady}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </div>
    </div>
  );
}
