import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { paypalEnabled, paypalMode } from "@/lib/paypal";
import { listDepositRequests, formatMoney } from "@/lib/deposits";
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
import RefreshButton from "./RefreshButton";

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

export default async function DepositsPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Deposits" />
        <NotConnected what="Deposits" />
      </>
    );
  }

  const [settings, deposits] = await Promise.all([
    getSettings(),
    listDepositRequests(200),
  ]);
  const enabled = paypalEnabled();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Deposits"
        description="Send a move-in deposit request. PayPal emails the family a secure invoice, hosts the payment page, and tracks whether it is paid. Payments go straight to your PayPal account."
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
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">
          History
        </h2>
        {deposits.length === 0 ? (
          <EmptyState
            icon="💳"
            title="No deposit requests yet"
            description="Deposit requests you send will appear here with their payment status."
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
                <Th className="text-right">Invoice</Th>
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
                    <div className="flex items-center justify-end gap-2">
                      {d.invoice_url && (
                        <a
                          href={d.invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-clay hover:text-clay-dark"
                        >
                          View
                        </a>
                      )}
                      <RefreshButton id={d.id} />
                    </div>
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
