"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendTextBlast, sendTestText } from "./actions";
import { Card, Textarea, Input, Button, SectionLabel } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { useToast } from "@/components/admin/Toast";

const OPT_OUT_LEN = "\n\nReply STOP to opt out.".length;

export default function TextComposer({
  enabled,
  recipientCount,
}: {
  enabled: boolean;
  recipientCount: number;
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [body, setBody] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [pending, start] = useTransition();
  const [testing, setTesting] = useState(false);

  // Rough SMS segment estimate (GSM-7: 160 for one part, 153 for multi-part).
  const total = body.length + (body ? OPT_OUT_LEN : 0);
  const segments = total === 0 ? 0 : total <= 160 ? 1 : Math.ceil(total / 153);
  const canSend = enabled && body.trim() !== "" && recipientCount > 0;

  async function onBlast() {
    return new Promise<void>((resolve) => {
      start(async () => {
        const res = await sendTextBlast(body);
        if (!res.ok) {
          toastError(res.error);
        } else {
          success(
            `Text sent to ${res.sent} of ${res.total} families${res.failed ? `, ${res.failed} failed` : ""}.`
          );
          setBody("");
          router.refresh();
        }
        resolve();
      });
    });
  }

  async function onTest() {
    setTesting(true);
    const res = await sendTestText(body, testPhone);
    setTesting(false);
    if (res.ok) success(`Test text sent to ${testPhone}.`);
    else toastError(res.error || "Could not send the test.");
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionLabel>New text</SectionLabel>
        <span className="text-xs text-ink-faint">
          {enabled ? (
            <>
              {recipientCount} opted-in recipient{recipientCount === 1 ? "" : "s"}
            </>
          ) : (
            "sending disabled"
          )}
        </span>
      </div>

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={1000}
        className="mt-3"
        placeholder="Short and community-wide. e.g. Reminder: family night is tonight at 6pm at Joy. Hope to see you!"
      />
      <div className="mt-1.5 flex items-center justify-between text-xs text-ink-faint">
        <span>“Reply STOP to opt out.” is added automatically.</span>
        <span>
          {body.length} chars · ~{segments} text{segments === 1 ? "" : "s"} each
        </span>
      </div>

      {/* Test send */}
      <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-line bg-paper/60 p-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-ink">
            Send a test to yourself first
          </label>
          <Input
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="(470) 555-0100"
          />
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={onTest}
          disabled={!enabled || testing || body.trim() === "" || testPhone.trim() === ""}
        >
          {testing ? "Sending…" : "Send test"}
        </Button>
      </div>

      <div className="mt-5">
        <ConfirmButton
          variant="primary"
          size="md"
          confirmVariant="primary"
          disabled={!canSend || pending}
          title="Send this text now?"
          message={
            <>
              This texts <strong>{recipientCount}</strong> opted-in famil
              {recipientCount === 1 ? "y" : "ies"} through Quo. Texts cannot be
              unsent.
            </>
          }
          confirmLabel={`Send to ${recipientCount}`}
          onConfirm={onBlast}
        >
          {pending ? "Sending…" : `Send to ${recipientCount} famil${recipientCount === 1 ? "y" : "ies"}`}
        </ConfirmButton>
        {!canSend && enabled && recipientCount === 0 && (
          <p className="mt-2 text-xs text-ink-faint">
            No one is opted in yet. Turn on <strong>Texts</strong> for family
            contacts in the Family list.
          </p>
        )}
      </div>
    </Card>
  );
}
