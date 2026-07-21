"use client";

import { useState, useTransition } from "react";
import { updateLeadStage } from "./actions";

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

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        setValue(next);
        start(async () => {
          await updateLeadStage({ id, stage: next });
        });
      }}
      className="rounded-md border border-line bg-white px-2 py-1 text-sm text-ink outline-none focus:border-clay disabled:opacity-60"
    >
      {STAGES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
