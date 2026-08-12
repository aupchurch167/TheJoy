"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { sendSurveyToAllFamilies } from "./actions";

export default function SendToAllButton({ count }: { count: number }) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, start] = useTransition();

  return (
    <Button
      variant="secondary"
      disabled={pending || count === 0}
      onClick={() => {
        if (
          !window.confirm(
            `Send a feedback survey to ${count} family member${count === 1 ? "" : "s"} with an email? Anyone who already has an open survey is skipped.`
          )
        )
          return;
        start(async () => {
          const res = await sendSurveyToAllFamilies();
          if (!res.ok) {
            error(res.error);
            return;
          }
          success(res.message);
          router.refresh();
        });
      }}
    >
      {pending
        ? "Sending…"
        : `Send to all families${count ? ` (${count})` : ""}`}
    </Button>
  );
}
