"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshDepositStatus } from "./actions";
import { Button } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";

/** Re-checks one deposit's status against PayPal on demand. */
export default function RefreshButton({ id }: { id: string }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [pending, start] = useTransition();

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await refreshDepositStatus(id);
          if (!res.ok) {
            toastError(res.error);
            return;
          }
          success(res.message);
          router.refresh();
        })
      }
    >
      {pending ? "Checking…" : "Refresh"}
    </Button>
  );
}
