"use client";

import { useTransition } from "react";
import { Button } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { submitSitemapToIndexNow } from "./actions";

export function IndexNowButton() {
  const [pending, start] = useTransition();
  const { success, error } = useToast();

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await submitSitemapToIndexNow();
          if (res.ok) success(`Sent ${res.submitted} pages to Bing.`);
          else error(res.error);
        })
      }
    >
      {pending ? "Sending..." : "Send all pages to Bing"}
    </Button>
  );
}
