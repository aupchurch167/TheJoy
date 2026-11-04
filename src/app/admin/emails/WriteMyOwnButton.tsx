"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import { btn, type ButtonSize, type ButtonVariant } from "@/components/admin/ui";
import { blankStudioSaveInput } from "@/lib/studio-draft";
import { saveStudioDraft } from "./actions";

/**
 * Creates an empty studio draft (no AI) and opens it in the email editor.
 */
export default function WriteMyOwnButton({
  variant = "secondary",
  size = "sm",
  className = "",
  label = "Write my own",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  async function onClick() {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    try {
      const res = await saveStudioDraft(blankStudioSaveInput());
      if (!res.ok) {
        toast.error(res.error);
        pendingRef.current = false;
        setPending(false);
        return;
      }
      router.push(`/admin/emails/${res.id}`);
    } catch {
      toast.error("Could not create the draft.");
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={btn(variant, size, className)}
    >
      {pending ? "Creating…" : label}
    </button>
  );
}
