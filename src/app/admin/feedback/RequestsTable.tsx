"use client";

import { useState } from "react";
import { Badge, EmptyState, TableWrap, Th, Td } from "@/components/admin/ui";
import { orDash, formatDate } from "@/lib/format";
import { ResendButton, CopyLinkButton } from "./CallbackControls";
import type { FeedbackRequestRow } from "@/lib/feedback";

const DAY = 24 * 60 * 60 * 1000;
const DIM_VALUE: Record<number, string> = { 1: "Needs work", 2: "Okay", 3: "Great" };
const RECOMMEND: Record<string, string> = {
  definitely: "Definitely",
  probably: "Probably",
  not_sure: "Not sure",
  no: "No",
};

export default function RequestsTable({
  rows,
  now,
  baseUrl,
}: {
  rows: FeedbackRequestRow[];
  now: number;
  baseUrl: string;
}) {
  const [open, setOpen] = useState<string | null>(null);

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
          const hasDetail = r.rating != null; // linked, non-anonymous
          const resendable =
            !completed &&
            now - new Date(r.sent_at ?? r.created_at).getTime() > 14 * DAY;
          const dims: [string, number | null][] = [
            ["Care", r.rating_care],
            ["Communication", r.rating_communication],
            ["Meals and dining", r.rating_dining],
            ["Feels like home", r.rating_home_feel],
            ["Activities", r.rating_engagement],
          ];
          const isOpen = open === r.id;
          return (
            <FragmentRow key={r.id}>
              <tr
                className={`transition-colors hover:bg-surface ${concern ? "bg-danger/[0.04]" : ""} ${hasDetail ? "cursor-pointer" : ""}`}
                onClick={() => hasDetail && setOpen(isOpen ? null : r.id)}
              >
                <Td>
                  <div className="flex items-center gap-1.5 font-medium text-ink">
                    {hasDetail && (
                      <span className="text-ink-faint">{isOpen ? "▾" : "▸"}</span>
                    )}
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
              {isOpen && hasDetail && (
                <tr className="bg-surface/60">
                  <td colSpan={6} className="px-4 py-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                          Ratings
                        </p>
                        <ul className="space-y-1 text-sm">
                          {dims.map(([lbl, v]) => (
                            <li key={lbl} className="flex justify-between gap-3">
                              <span className="text-ink-soft">{lbl}</span>
                              <span
                                className={
                                  v === 1 ? "font-medium text-danger" : "text-ink"
                                }
                              >
                                {v != null ? DIM_VALUE[v] : "—"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-3 text-sm">
                        <Answer label="Going well" value={r.going_well} />
                        <Answer label="Could be better" value={r.could_be_better} />
                        <Answer label="Suggestions" value={r.suggestions} />
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </FragmentRow>
          );
        })}
      </tbody>
    </TableWrap>
  );
}

function Answer({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p className="mt-0.5 whitespace-pre-wrap text-ink">{value}</p>
    </div>
  );
}

// tbody children must be <tr>; this passthrough lets us return two rows per item.
function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
