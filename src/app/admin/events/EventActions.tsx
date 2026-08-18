"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, btn } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { createEventEmailDraft } from "./actions";

/**
 * Build an invite / reminder / update email for an event (a ready-to-send draft
 * broadcast) and jump to the composer to pick recipients and send. Plus a
 * one-click copy of the public RSVP link.
 */
export default function EventActions({
  eventId,
  rsvpUrl,
}: {
  eventId: string;
  rsvpUrl: string;
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, start] = useTransition();

  function compose(kind: "invite" | "reminder" | "update") {
    start(async () => {
      const res = await createEventEmailDraft({ eventId, kind });
      if (!res.ok) {
        error(res.error);
        return;
      }
      router.push(`/admin/emails/${res.id}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" disabled={pending} onClick={() => compose("invite")}>
        {pending ? "Preparing…" : "Send invite"}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() => compose("reminder")}
      >
        Send reminder
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() => compose("update")}
      >
        Send update
      </Button>
      <CopyLink url={rsvpUrl} onCopied={() => success("RSVP link copied.")} />
    </div>
  );
}

function CopyLink({ url, onCopied }: { url: string; onCopied: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={btn("ghost", "sm")}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          onCopied();
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked */
        }
      }}
    >
      {copied ? "Copied ✓" : "Copy RSVP link"}
    </button>
  );
}
