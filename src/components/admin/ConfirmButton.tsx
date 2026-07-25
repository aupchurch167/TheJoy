"use client";

import { useEffect, useState, type ReactNode } from "react";
import { btn, type ButtonVariant } from "./ui";

/**
 * A button that opens a confirmation modal before running its action. Use for
 * every destructive action (delete, remove, send) so nothing irreversible fires
 * on a single click. The action runs while a spinner shows in the modal.
 */
export default function ConfirmButton({
  onConfirm,
  children,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  variant = "danger",
  size = "sm",
  className = "",
  disabled,
}: {
  onConfirm: () => void | Promise<void>;
  children: ReactNode;
  title?: string;
  message?: ReactNode;
  confirmLabel?: string;
  confirmVariant?: ButtonVariant;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy]);

  async function run() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={btn(variant, size, className)}
      >
        {children}
      </button>

      {open && (
        <div
          className="admin-fade fixed inset-0 z-[110] flex items-center justify-center bg-ink/40 p-4"
          onClick={() => !busy && setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div
            className="admin-rise w-full max-w-sm rounded-xl border border-line bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6">
              <h2 className="font-display text-lg font-semibold text-ink">
                {title}
              </h2>
              {message && (
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {message}
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-line px-6 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className={btn("secondary", "sm")}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={run}
                disabled={busy}
                className={btn(confirmVariant, "sm")}
              >
                {busy ? "Working…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
