"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Right-side slide-over panel over a dimmed backdrop. Shared shell for the
 * Add/Edit partner form and the Email composer. Escape closes; backdrop click
 * closes; body scroll is locked while open.
 */
export default function SlideOver({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  width = "max-w-[520px]",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true">
      <div className="admin-fade absolute inset-0 bg-ink/40" onClick={onClose} />
      <div
        className={`admin-slide-in absolute inset-y-0 right-0 flex w-full ${width} flex-col border-l border-line bg-white shadow-xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-surface hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
