"use client";

import { useState } from "react";
import { Badge, EmptyState, TableWrap, Th, Td } from "@/components/admin/ui";
import { orDash, formatDate } from "@/lib/format";
import { ResendButton, CopyLinkButton } from "./CallbackControls";
import ResponseReader from "./ResponseReader";
import type { FeedbackRequestRow, ReadableResponse } from "@/lib/feedback";

const DAY = 24 * 60 * 60 * 1000;
const RECOMMEND: Record<string, string> = {
  definitely: "Definitely",
  probably: "Probably",
  not_sure: "Not sure",
  no: "No",
};

export default function RequestsTable({
  rows,
  responses,
  now,
  baseUrl,
}: {
  rows: FeedbackRequestRow[];
  responses: ReadableResponse[];
  now: number;
  baseUrl: string;
}) {
  const [readerIdx, setReaderIdx] = useState<number | null>(null);
  const anonCount = responses.filter((r) => r.is_anonymous).length;

  // Clicking a family's row jumps the reader to their response.
  function openReaderFor(row: FeedbackRequestRow) {
    const i = responses.findIndex((d) => d.request_id === row.id);
    if (i >= 0) setReaderIdx(i);
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="No surveys yet"
        description="Use “Send survey” to invite a family to share how things are going."
      />
    );
  }

  return (
    <>
      {responses.length > 0 && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-ink-soft">
            {responses.length} response{responses.length === 1 ? "" : "s"} to read
            {anonCount > 0
              ? ` (including ${anonCount} anonymous)`
              : ""}
            .
          </p>
          <button
            type="button"
            onClick={() => setReaderIdx(0)}
            className="rounded-lg bg-clay px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-clay-dark"
          >
            Read responses →
          </button>
        </div>
      )}

      <TableWrap>
        <thead>
          <tr className="border-b border-line">
            <Th>Family</Th>
            <Th>Sent</Th>
            <Th>Status</Th>
            <Th>Overall</Th>
            <Th>Recommend</Th>
            <Th />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => {
            const completed = !!r.completed_at;
            const anonymous = completed && r.rating == null;
            const concern = r.sentiment === "concern";
            const hasDetail = r.rating != null;
            const resendable =
              !completed &&
              now - new Date(r.sent_at ?? r.created_at).getTime() > 14 * DAY;
            return (
              <tr
                key={r.id}
                className={`transition-colors hover:bg-surface ${concern ? "bg-danger/[0.04]" : ""} ${hasDetail ? "cursor-pointer" : ""}`}
                onClick={() => hasDetail && openReaderFor(r)}
              >
                <Td>
                  <div className="flex items-center gap-1.5 font-medium text-ink">
                    {hasDetail && <span className="text-ink-faint">▸</span>}
                    {orDash(r.family_name)}
                  </div>
                  <div className="text-xs text-ink-faint">
                    {r.family_email || r.family_phone || "—"}
                    {r.channel === "sms" && " · text"}
                    {r.channel === "both" && r.family_phone
                      ? ` · ${r.family_phone}`
                      : ""}
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
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <span className="font-medium text-clay">
                        {"♥".repeat(r.rating)}
                        <span className="text-ink-faint">
                          {"♥".repeat(5 - r.rating)}
                        </span>
                      </span>
                      <Badge tone={concern ? "danger" : "success"}>
                        {concern ? "concern" : "positive"}
                      </Badge>
                    </span>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td className="text-ink-soft">
                  {r.would_recommend ? RECOMMEND[r.would_recommend] : "—"}
                </Td>
                <Td className="text-right">
                  <div
                    className="flex flex-col items-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!completed && (
                      <CopyLinkButton url={`${baseUrl}/feedback/${r.token}`} />
                    )}
                    {resendable && <ResendButton id={r.id} />}
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </TableWrap>

      {readerIdx != null && (
        <ResponseReader
          rows={responses}
          index={readerIdx}
          onIndex={setReaderIdx}
          onClose={() => setReaderIdx(null)}
        />
      )}
    </>
  );
}
