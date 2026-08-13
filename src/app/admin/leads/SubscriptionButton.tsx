"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { btn } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { setLeadSubscription } from "./actions";

export default function SubscriptionButton({
  id,
  unsubscribed,
}: {
  id: string;
  unsubscribed: boolean;
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        // If currently unsubscribed, this action re-subscribes; otherwise it
        // unsubscribes.
        const subscribing = unsubscribed;
        const ok = window.confirm(
          subscribing
            ? "Re-subscribe this lead to emails?"
            : "Unsubscribe this lead from all emails? They will be skipped on every send."
        );
        if (!ok) return;
        start(async () => {
          const res = await setLeadSubscription({ id, subscribed: subscribing });
          if (!res.ok) {
            error("Could not update. Please try again.");
            return;
          }
          success(subscribing ? "Re-subscribed." : "Unsubscribed.");
          router.refresh();
        });
      }}
      className={btn(unsubscribed ? "secondary" : "ghost", "sm")}
    >
      {pending ? "Saving…" : unsubscribed ? "Resubscribe" : "Unsubscribe"}
    </button>
  );
}
