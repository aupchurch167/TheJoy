"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { sendTestSurveyText } from "./actions";

/**
 * Preview the survey text and send a real copy to your own phone, so you can see
 * exactly what families receive (wording and a working link) before sending to
 * anyone. `preview` is the exact body, built on the server so it never drifts.
 */
export default function SendTestTextForm({
  smsEnabled,
  preview,
}: {
  smsEnabled: boolean;
  preview: string;
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await sendTestSurveyText({ phone });
      if (!res.ok) {
        setError(res.error);
        toastError(res.error);
        return;
      }
      success(res.message);
      setPhone("");
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Preview / test text
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={submit} className="grid gap-3">
        <p className="text-sm font-semibold text-ink">Survey text</p>

        {/* The exact message families get, styled like a phone bubble. */}
        <p className="whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-clay/10 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
          {preview}
        </p>
        <p className="text-xs text-ink-faint">
          The link is unique per family. On a real send it opens the survey; the
          test sends a working link to your phone.
        </p>

        <Field label="Send a test to my phone" htmlFor="tt-phone">
          <Input
            id="tt-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(404) 555-0100"
          />
        </Field>

        {!smsEnabled && (
          <p className="text-xs text-ink-faint">
            Texting is not configured yet. Set QUO_API_KEY and QUO_FROM_NUMBER to
            send.
          </p>
        )}
        {error && (
          <p className="text-sm font-medium text-danger" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending || !phone.trim()}>
            {pending ? "Sending…" : "Send test text"}
          </Button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={pending}
            className="text-sm font-medium text-ink-faint underline underline-offset-2 hover:text-clay disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </form>
    </Card>
  );
}
