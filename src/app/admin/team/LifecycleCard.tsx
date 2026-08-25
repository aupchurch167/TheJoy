"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import { Card, SectionLabel } from "@/components/admin/ui";
import { setAutoEnrollAction } from "./actions";

export type LifecycleRow = {
  id: string;
  title: string;
  kind: string;
  send_offset_days: number | null;
  auto_enroll: boolean;
  completed: number;
};

function when(row: LifecycleRow): string {
  if (row.kind === "exit") return "Sent when someone leaves";
  return `Sent ${row.send_offset_days} days after hire`;
}

function Toggle({
  on,
  onChange,
  busy,
}: {
  on: boolean;
  onChange: () => void;
  busy: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      disabled={busy}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        on ? "bg-sage" : "bg-line"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function LifecycleCard({ rows }: { rows: LifecycleRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const onboarding = rows
    .filter((r) => r.kind === "onboarding")
    .sort((a, b) => (a.send_offset_days ?? 0) - (b.send_offset_days ?? 0));
  const exit = rows.filter((r) => r.kind === "exit");
  const ordered = [...onboarding, ...exit];

  async function toggle(row: LifecycleRow) {
    setBusyId(row.id);
    const res = await setAutoEnrollAction(row.id, !row.auto_enroll);
    setBusyId(null);
    if (res.ok) {
      toast.success(
        !row.auto_enroll ? "Automation on." : "Automation paused."
      );
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Card className="mb-6">
      <SectionLabel>Automatic check-ins</SectionLabel>
      <p className="mt-2 text-sm text-ink-faint">
        These send themselves based on the Connecteam roster. New hires get the
        onboarding check-ins; anyone who leaves gets an anonymous exit survey.
        Tap a title to edit its questions or read responses.
      </p>
      <div className="mt-4 divide-y divide-line">
        {ordered.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <Link
                href={`/admin/team/${row.id}`}
                className="text-sm font-semibold text-ink hover:text-clay-dark"
              >
                {row.title}
              </Link>
              <div className="text-xs text-ink-faint">
                {when(row)}
                {row.completed > 0 ? ` · ${row.completed} answered` : ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ink-faint">
                {row.auto_enroll ? "On" : "Off"}
              </span>
              <Toggle
                on={row.auto_enroll}
                busy={busyId === row.id}
                onChange={() => toggle(row)}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
