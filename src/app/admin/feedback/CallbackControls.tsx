"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { updateCallbackStatus } from "./actions";
import { resendSurvey } from "./actions";
import type { CallbackStatus } from "@/lib/feedback";

export function CallbackStatusControl({
  id,
  status,
}: {
  id: string;
  status: CallbackStatus;
}) {
  const router = useRouter();
  const { error: toastError } = useToast();
  const [pending, start] = useTransition();
  return (
    <Select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as CallbackStatus;
        start(async () => {
          const res = await updateCallbackStatus({ id, status: next });
          if (!res.ok) toastError("Could not update the status.");
          router.refresh();
        });
      }}
      className="h-9 max-w-[10rem]"
    >
      <option value="open">Open</option>
      <option value="contacted">Contacted</option>
      <option value="resolved">Resolved</option>
    </Select>
  );
}

export function ResendButton({ id }: { id: string }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await resendSurvey(id);
          if (!res.ok) {
            toastError(res.error);
            return;
          }
          success(res.message);
          router.refresh();
        })
      }
      className="text-xs font-semibold text-clay hover:text-clay-dark disabled:opacity-50"
    >
      {pending ? "Sending…" : "Re-send"}
    </button>
  );
}
