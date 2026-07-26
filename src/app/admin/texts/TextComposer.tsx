"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendTextBlast, sendTestToAdmins } from "./actions";
import { Card, Textarea, Button, SectionLabel } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { useToast } from "@/components/admin/Toast";

const OPT_OUT_LEN = "\n\nReply STOP to opt out.".length;

export default function TextComposer({
  enabled,
  recipientCount,
  testNumberCount,
}: {
  enabled: boolean;
  recipientCount: number;
  testNumberCount: number;
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [body, setBody] = useState("");
  // The message text that was last successfully tested. The blast unlocks only
  // while the current text matches this exactly.
  const [testedBody, setTestedBody] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [testing, setTesting] = useState(false);

  const trimmed = body.trim();
  const isTested = testedBody !== null && testedBody === trimmed;

  const total = body.length + (body ? OPT_OUT_LEN : 0);
  const segments = total === 0 ? 0 : total <= 160 ? 1 : Math.ceil(total / 153);

  const canTest = enabled && trimmed !== "" && testNumberCount > 0 && !testing;
  const canBlast = enabled && isTested && recipientCount > 0;

  async function onTest() {
    setTesting(true);
    const res = await sendTestToAdmins(body);
    setTesting(false);
    if (!res.ok) {
      toastError(res.error);
      return;
    }
    setTestedBody(trimmed);
    success(
      `Test sent to ${res.sent} owner/admin number${res.sent === 1 ? "" : "s"}. Review it, then send the blast.`
    );
  }

  async function onBlast() {
    return new Promise<void>((resolve) => {
      start(async () => {
        const res = await sendTextBlast(body);
        if (!res.ok) {
          if (res.needsTest) setTestedBody(null);
          toastError(res.error);
        } else {
          success(
            `Text sent to ${res.sent} of ${res.total} families${res.failed ? `, ${res.failed} failed` : ""}.`
          );
          setBody("");
          setTestedBody(null);
          router.refresh();
        }
        resolve();
      });
    });
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

      {/* Step 1: required test to owners & admin */}
      <div className="mt-4 rounded-lg border border-line bg-paper/60 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">
              Step 1 · Test to owners &amp; admin{" "}
              {isTested && <span className="text-sage">✓ done</span>}
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">
              {testNumberCount > 0 ? (
                <>
                  Sends this exact message to {testNumberCount} owner/admin number
                  {testNumberCount === 1 ? "" : "s"} for review. Required before a
                  blast; editing the message means testing again.
                </>
              ) : (
                <>
                  Add owner/admin numbers in{" "}
                  <Link href="/admin/settings" className="font-medium text-clay hover:text-clay-dark">
                    Settings
                  </Link>{" "}
                  to enable testing.
                </>
              )}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={onTest} disabled={!canTest}>
            {testing ? "Sending…" : "Send test"}
          </Button>
        </div>
      </div>

      {/* Step 2: the blast, locked until tested */}
      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-ink">
          Step 2 · Send to families{" "}
          {!isTested && trimmed !== "" && (
            <span className="text-ink-faint">(locked until tested)</span>
          )}
        </p>
        <ConfirmButton
          variant="primary"
          size="md"
          confirmVariant="primary"
          disabled={!canBlast || pending}
          title="Send this text now?"
          message={
            <>
              This texts <strong>{recipientCount}</strong> opted-in famil
              {recipientCount === 1 ? "y" : "ies"} through Quo. You already tested
              this message with the owners/admins. Texts cannot be unsent.
            </>
          }
          confirmLabel={`Send to ${recipientCount}`}
          onConfirm={onBlast}
        >
          {pending
            ? "Sending…"
            : `Send to ${recipientCount} famil${recipientCount === 1 ? "y" : "ies"}`}
        </ConfirmButton>
        {enabled && recipientCount === 0 && (
          <p className="mt-2 text-xs text-ink-faint">
            No one is opted in yet. Turn on <strong>Texts</strong> for family
            contacts in the Family list.
          </p>
        )}
      </div>
    </Card>
  );
}
