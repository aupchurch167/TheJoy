"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { optOutOfTexts } from "@/app/admin/texts/actions";
import { useToast } from "@/components/admin/Toast";
import { Badge } from "@/components/admin/ui";

/**
 * Permanent text opt-out for one lead. Distinct from email unsubscribe and
 * from the reversible "texts on/off" consent toggle on the family list.
 */
export default function OptOutTextsButton({
  id,
  name,
  optedOut,
}: {
  id: string;
  name: string;
  optedOut: boolean;
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, start] = useTransition();

  if (optedOut) {
    return <Badge tone="danger">Opted out of texts</Badge>;
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const who = name.trim() || "this person";
        const ok = window.confirm(
          `Opt ${who} out of texts? They asked to stop. This number will be skipped on family texts, survey texts, and deposit reminders. You cannot turn texts back on for this number.`
        );
        if (!ok) return;
        start(async () => {
          const res = await optOutOfTexts(id);
          if (!res.ok) {
            error("Could not save the opt-out. Please try again.");
            return;
          }
          success(`${who} opted out of texts.`);
          router.refresh();
        });
      }}
      className="text-left text-xs font-semibold text-clay hover:text-clay-dark disabled:opacity-50"
    >
      {pending ? "Saving…" : "Opt out of texts (they asked to stop)"}
    </button>
  );
}
