"use client";

import { useState, useTransition } from "react";
import { updateLeadStage } from "./actions";
import { useToast } from "@/components/admin/Toast";

const STAGES: { value: string; label: string }[] = [
  { value: "new", label: "New" },
  { value: "toured", label: "Toured" },
  { value: "moved_in", label: "Moved in" },
  { value: "lost", label: "Lost" },
];

export default function StageSelect({
  id,
  stage,
}: {
  id: string;
  stage: string;
}) {
  const [value, setValue] = useState(stage);
  const [pending, start] = useTransition();
  const { success, error } = useToast();

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => {
        const prev = value;
        const next = e.target.value;
        setValue(next);
        start(async () => {
          try {
            const res = await updateLeadStage({ id, stage: next });
            if (!res?.ok) throw new Error("failed");
            success(
              `Stage set to ${STAGES.find((s) => s.value === next)?.label ?? next}.`
            );
          } catch {
            setValue(prev);
            error("Could not update the stage. Please try again.");
          }
        });
      }}
      className="h-9 rounded-lg border border-line bg-white px-2 pr-7 text-sm text-ink transition-colors focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30 disabled:opacity-60"
    >
      {STAGES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
