"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import { Button } from "@/components/admin/ui";
import { setDripPausedAction } from "../actions";

export default function DripPauseToggle({ paused }: { paused: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await setDripPausedAction(!paused);
    setBusy(false);
    if (res.ok) {
      toast.success(paused ? "Drip resumed." : "Drip paused.");
      router.refresh();
    } else {
      toast.error("Could not update the drip.");
    }
  }

  return (
    <div
      className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
        paused
          ? "border-danger/30 bg-danger/[0.06]"
          : "border-line bg-white"
      }`}
    >
      <div className="text-sm">
        <span className="font-semibold text-ink">
          Automatic nurture drip is {paused ? "paused" : "on"}.
        </span>{" "}
        <span className="text-ink-soft">
          {paused
            ? "No drip emails will go out until you resume."
            : "New leads get the welcome note, then three follow-ups over the next week."}
        </span>
      </div>
      <Button
        variant={paused ? "primary" : "secondary"}
        size="sm"
        onClick={toggle}
        disabled={busy}
      >
        {busy ? "…" : paused ? "Resume drip" : "Pause drip"}
      </Button>
    </div>
  );
}
