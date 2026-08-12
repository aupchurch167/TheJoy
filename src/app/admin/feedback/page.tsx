import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { listFeedbackRequests, listCallbackRequests } from "@/lib/feedback";
import { formatDate, orDash } from "@/lib/format";
import SendSurveyForm from "./SendSurveyForm";
import { CallbackStatusControl, ResendButton } from "./CallbackControls";
import {
  PageHeader,
  Badge,
  EmptyState,
  NotConnected,
  SectionLabel,
  TableWrap,
  Th,
  Td,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

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

  const [requests, callbacks] = await Promise.all([
    listFeedbackRequests(),
    listCallbackRequests(),
  ]);

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
        actions={<SendSurveyForm />}
      />

      {/* Requests */}
      <section>
        <SectionLabel>Surveys</SectionLabel>
        <div className="mt-3">
          {sorted.length === 0 ? (
            <EmptyState
              icon="📝"
              title="No surveys yet"
              description="Use “Send survey” to invite a family to share how things are going."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr className="border-b border-line">
                  <Th>Family</Th>
                  <Th>Sent</Th>
                  <Th>Status</Th>
                  <Th>Rating</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sorted.map((r) => {
                  const completed = !!r.completed_at;
                  const anonymous = completed && r.rating == null;
                  const concern = r.sentiment === "concern";
                  const ageFrom = r.sent_at ?? r.created_at;
                  const resendable =
                    !completed &&
                    now - new Date(ageFrom).getTime() > 14 * DAY;
                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors hover:bg-surface ${
                        concern ? "bg-danger/[0.04]" : ""
                      }`}
                    >
                      <Td>
                        <div className="font-medium text-ink">
                          {orDash(r.family_name)}
                        </div>
                        <div className="text-xs text-ink-faint">
                          {r.family_email}
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap text-ink-faint">
                        {r.sent_at ? formatDate(r.sent_at) : "—"}
                      </Td>
                      <Td>
                        {completed ? (
                          anonymous ? (
                            <Badge tone="neutral">completed · anonymous</Badge>
                          ) : (
                            <Badge tone="success">completed</Badge>
                          )
                        ) : r.sent_at ? (
                          <Badge tone="info">sent</Badge>
                        ) : (
                          <Badge tone="neutral">created</Badge>
                        )}
                      </Td>
                      <Td>
                        {r.rating != null ? (
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-ink">
                              {r.rating}/5
                            </span>
                            <Badge tone={concern ? "danger" : "success"}>
                              {concern ? "concern" : "positive"}
                            </Badge>
                          </span>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td className="text-right">
                        {resendable && <ResendButton id={r.id} />}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
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
