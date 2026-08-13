"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Select } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { sendSurveyToAllFamilies } from "./actions";
import type { SurveyChannel } from "@/lib/feedback";

/**
 * Bulk "send survey" control with a channel picker (email, text, or both).
 * Options are limited to configured channels. The cadence guardrail lives in
 * the action, so re-sending only reaches families who are due again; the
 * confirm dialog spells that out.
 */
export default function SendToAllButton({
  emailCount,
  smsCount,
  emailEnabled,
  smsEnabled,
  intervalDays,
}: {
  emailCount: number;
  smsCount: number;
  emailEnabled: boolean;
  smsEnabled: boolean;
  intervalDays: number;
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, start] = useTransition();

  // Default to whatever is available (prefer email when both are configured).
  const [channel, setChannel] = useState<SurveyChannel>(
    emailEnabled ? "email" : "sms"
  );

  const options: { value: SurveyChannel; label: string }[] = [];
  if (emailEnabled) options.push({ value: "email", label: `Email (${emailCount})` });
  if (smsEnabled) options.push({ value: "sms", label: `Text (${smsCount})` });
  if (emailEnabled && smsEnabled)
    options.push({ value: "both", label: "Email + text" });

  // Nothing configured: show a disabled hint rather than a dead button.
  if (options.length === 0) {
    return (
      <span className="text-xs text-ink-faint">
        Add email or text keys to send surveys.
      </span>
    );
  }

  const reach =
    channel === "email"
      ? emailCount
      : channel === "sms"
        ? smsCount
        : Math.max(emailCount, smsCount);

  const channelWord =
    channel === "email" ? "email" : channel === "sms" ? "a text" : "email and text";

  return (
    <div className="flex items-center gap-2">
      {options.length > 1 && (
        <Select
          aria-label="Survey channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value as SurveyChannel)}
          disabled={pending}
          className="w-auto text-sm"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      )}
      <Button
        variant="secondary"
        disabled={pending || reach === 0}
        onClick={() => {
          if (
            !window.confirm(
              `Send a feedback survey by ${channelWord} to eligible family members? ` +
                `Anyone already surveyed in the last ${intervalDays} days is skipped.`
            )
          )
            return;
          start(async () => {
            const res = await sendSurveyToAllFamilies({ channels: channel });
            if (!res.ok) {
              error(res.error);
              return;
            }
            success(res.message);
            router.refresh();
          });
        }}
      >
        {pending ? "Sending…" : "Send to all families"}
      </Button>
    </div>
  );
}
