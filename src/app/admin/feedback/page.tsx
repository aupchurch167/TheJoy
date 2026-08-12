import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { listFeedbackRequests, listCallbackRequests } from "@/lib/feedback";
import { getSubscribedByAudience } from "@/lib/leads";
import { SITE_URL } from "@/lib/site";
import { formatDate, orDash } from "@/lib/format";
import SendSurveyForm from "./SendSurveyForm";
import SendToAllButton from "./SendToAllButton";
import { CallbackStatusControl } from "./CallbackControls";
import RequestsTable from "./RequestsTable";
import {
  PageHeader,
  EmptyState,
  NotConnected,
  SectionLabel,
  TableWrap,
  Th,
  Td,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Family feedback" />
        <NotConnected what="Family feedback" />
      </>
    );
  }

  const [requests, callbacks, families] = await Promise.all([
    listFeedbackRequests(),
    listCallbackRequests(),
    getSubscribedByAudience("families"),
  ]);
  const familyCount = families.length;

  // Concerns to the top, then newest first.
  const sorted = [...requests].sort((a, b) => {
    const ac = a.sentiment === "concern" ? 1 : 0;
    const bc = b.sentiment === "concern" ? 1 : 0;
    if (ac !== bc) return bc - ac;
    return a.created_at < b.created_at ? 1 : -1;
  });

  // eslint-disable-next-line react-hooks/purity -- server component; time-based UI
  const now = Date.now();

  return (
    <>
      <PageHeader
        title="Family feedback"
        description="Send a short survey to a family. Happy families are pointed to public reviews; concerns come here first, with an alert to you, so you can make it right."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SendToAllButton count={familyCount} />
            <SendSurveyForm />
          </div>
        }
      />

      {/* Requests */}
      <section>
        <SectionLabel>Surveys</SectionLabel>
        <p className="mt-1 text-sm text-ink-soft">
          Concerns are flagged and sorted to the top. Click a completed row to
          see the detailed ratings and written answers.
        </p>
        <div className="mt-3">
          <RequestsTable rows={sorted} now={now} baseUrl={SITE_URL} />
        </div>
      </section>

      {/* Callback requests */}
      <section className="mt-10">
        <SectionLabel>Callback requests</SectionLabel>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Families who asked for a personal call after flagging a concern. Work
          the open ones first.
        </p>
        <div className="mt-3">
          {callbacks.length === 0 ? (
            <EmptyState
              icon="📞"
              title="No callback requests"
              description="When a family asks to be called back, it appears here."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr className="border-b border-line">
                  <Th>Name</Th>
                  <Th>Phone</Th>
                  <Th>Preferred time</Th>
                  <Th>Requested</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {callbacks.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-surface">
                    <Td className="font-medium text-ink">
                      {orDash(c.contact_name)}
                    </Td>
                    <Td className="whitespace-nowrap text-ink-soft">
                      <a
                        href={`tel:${c.contact_phone.replace(/[^\d+]/g, "")}`}
                        className="text-clay hover:text-clay-dark"
                      >
                        {c.contact_phone}
                      </a>
                    </Td>
                    <Td className="text-ink-soft">{orDash(c.preferred_time)}</Td>
                    <Td className="whitespace-nowrap text-ink-faint">
                      {formatDate(c.created_at)}
                    </Td>
                    <Td>
                      <CallbackStatusControl id={c.id} status={c.status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </div>
      </section>
    </>
  );
}
