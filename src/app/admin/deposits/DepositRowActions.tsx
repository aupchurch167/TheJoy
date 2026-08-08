"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import {
  refreshDepositStatus,
  cancelDepositRequest,
  setDepositArchivedState,
  deleteDepositRequest,
  sendDepositReminderEmail,
  sendDepositReminderText,
  type DepositResult,
} from "./actions";

/**
 * Per-row actions for a deposit, in a kebab (⋮) dropdown: view the invoice,
 * resend the link by email or text, refresh status, cancel (on PayPal),
 * archive/restore, or delete the local record. Destructive actions (cancel,
 * delete) ask for confirmation inline within the menu.
 *
 * The menu is fixed-positioned (anchored to the button) so it is never clipped
 * by the history table's horizontal scroll container.
 */
export default function DepositRowActions({
  id,
  invoiceUrl,
  hasPhone,
  archived,
  cancelable,
  emailReady,
  smsReady,
}: {
  id: string;
  invoiceUrl: string | null;
  hasPhone: boolean;
  archived: boolean;
  cancelable: boolean;
  emailReady: boolean;
  smsReady: boolean;
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | "cancel" | "delete">(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [pending, start] = useTransition();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const WIDTH = 224;

  function toggle() {
    if (open) {
      setOpen(false);
      setConfirm(null);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, left: Math.max(8, r.right - WIDTH) });
    setConfirm(null);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        !btnRef.current?.contains(t) &&
        !menuRef.current?.contains(t)
      ) {
        setOpen(false);
        setConfirm(null);
      }
    };
    const close = () => {
      setOpen(false);
      setConfirm(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    // Close on any scroll (incl. the table's) or resize so it never drifts.
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function run(fn: () => Promise<DepositResult>) {
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        toastError(res.error);
      } else {
        success(res.message);
        router.refresh();
      }
      setOpen(false);
      setConfirm(null);
    });
  }

  const item =
    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-surface disabled:cursor-not-allowed disabled:opacity-45";

  return (
    <div className="flex justify-end">
      <button
        ref={btnRef}
        type="button"
        aria-label="Actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-surface"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="12" cy="19" r="1.7" />
        </svg>
      </button>

      {open && pos && (
        <div
          ref={menuRef}
          role="menu"
          className="admin-rise fixed z-[120] rounded-xl border border-line bg-white p-1.5 shadow-lg"
          style={{ top: pos.top, left: pos.left, width: WIDTH }}
        >
          {confirm === null ? (
            <>
              {invoiceUrl && (
                <a
                  href={invoiceUrl}
                  target="_blank"
                  rel="noreferrer"
                  role="menuitem"
                  className={item}
                  onClick={() => setOpen(false)}
                >
                  View invoice
                </a>
              )}
              <button
                type="button"
                role="menuitem"
                className={item}
                disabled={pending || !emailReady}
                title={emailReady ? undefined : "Email is not turned on"}
                onClick={() => run(() => sendDepositReminderEmail(id))}
              >
                Email reminder
              </button>
              <button
                type="button"
                role="menuitem"
                className={item}
                disabled={pending || !hasPhone || !smsReady}
                title={
                  !hasPhone
                    ? "No phone on this request"
                    : !smsReady
                      ? "Texting is not set up"
                      : undefined
                }
                onClick={() => run(() => sendDepositReminderText(id))}
              >
                Text reminder
              </button>
              <button
                type="button"
                role="menuitem"
                className={item}
                disabled={pending}
                onClick={() => run(() => refreshDepositStatus(id))}
              >
                Refresh status
              </button>

              <div className="my-1 border-t border-line" />

              {cancelable && (
                <button
                  type="button"
                  role="menuitem"
                  className={`${item} text-gold`}
                  disabled={pending}
                  onClick={() => setConfirm("cancel")}
                >
                  Cancel request
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                className={item}
                disabled={pending}
                onClick={() => run(() => setDepositArchivedState(id, !archived))}
              >
                {archived ? "Restore from archive" : "Archive"}
              </button>
              <button
                type="button"
                role="menuitem"
                className={`${item} text-danger`}
                disabled={pending}
                onClick={() => setConfirm("delete")}
              >
                Delete
              </button>
            </>
          ) : (
            <div className="p-2">
              <p className="text-sm font-medium text-ink">
                {confirm === "cancel"
                  ? "Cancel this deposit request?"
                  : "Delete this record?"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                {confirm === "cancel"
                  ? "This voids the invoice on PayPal so it can no longer be paid."
                  : "This removes it from your history here. PayPal keeps its own copy."}
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink hover:bg-surface disabled:opacity-60"
                  disabled={pending}
                  onClick={() => setConfirm(null)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-danger px-3 py-1.5 text-sm font-semibold text-white hover:bg-danger-dark disabled:opacity-60"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      confirm === "cancel"
                        ? cancelDepositRequest(id)
                        : deleteDepositRequest(id)
                    )
                  }
                >
                  {pending
                    ? "Working…"
                    : confirm === "cancel"
                      ? "Cancel it"
                      : "Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
