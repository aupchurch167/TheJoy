"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import { Button } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import {
  sendSurveyToTeam,
  setSurveyStatusAction,
  deleteSurveyAction,
} from "../actions";

export default function SurveyControls({
  surveyId,
  status,
  reachable,
  kind = "pulse",
  system = false,
}: {
  surveyId: string;
  status: "draft" | "open" | "closed";
  reachable: number;
  kind?: "pulse" | "onboarding" | "exit";
  /** A seeded system template (onboarding/exit): no manual send, no delete. */
  system?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    const res = await sendSurveyToTeam(surveyId);
    setBusy(false);
    if (res.ok) {
      toast.success(res.message ?? "Sent.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function setStatus(next: "open" | "closed") {
    setBusy(true);
    const res = await setSurveyStatusAction(surveyId, next);
    setBusy(false);
    if (res.ok) {
      toast.success(next === "closed" ? "Survey closed." : "Survey reopened.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  const isPulse = kind === "pulse";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Manual send only for pulse surveys; lifecycle surveys send themselves. */}
      {isPulse && status !== "closed" && (
        <Button onClick={send} disabled={busy || reachable === 0} size="sm">
          {status === "draft"
            ? `Send to team (${reachable})`
            : `Send to anyone new (${reachable})`}
        </Button>
      )}
      {status === "open" && (
        <Button variant="secondary" size="sm" onClick={() => setStatus("closed")} disabled={busy}>
          {isPulse ? "Close survey" : "Pause"}
        </Button>
      )}
      {status === "closed" && (
        <Button variant="secondary" size="sm" onClick={() => setStatus("open")} disabled={busy}>
          {isPulse ? "Reopen" : "Resume"}
        </Button>
      )}
      {!system && (
        <ConfirmButton
          variant="ghost"
          size="sm"
          title="Delete this survey?"
          message="This removes the survey and all its responses. This cannot be undone."
          confirmLabel="Delete"
          onConfirm={async () => {
            const res = await deleteSurveyAction(surveyId);
            if (res.ok) {
              toast.success("Survey deleted.");
              router.push("/admin/team");
            } else {
              toast.error(res.error);
            }
          }}
        >
          Delete
        </ConfirmButton>
      )}
    </div>
  );
}
