"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import { removeRsvp } from "./actions";

export default function RemoveRsvpButton({ id }: { id: string }) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Remove this RSVP?")) return;
        start(async () => {
          const res = await removeRsvp(id);
          if (!res.ok) {
            error("Could not remove it.");
            return;
          }
          success("RSVP removed.");
          router.refresh();
        });
      }}
      className="text-xs font-medium text-ink-faint underline underline-offset-2 hover:text-danger disabled:opacity-50"
    >
      Remove
    </button>
  );
}
