"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

/**
 * Lightweight toast system for the admin. Wrap the admin tree in <ToastProvider>
 * and call useToast() from any client component to confirm create/update/delete
 * actions or surface errors.
 */

type ToastTone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: ToastTone };

type ToastApi = {
  toast: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

let counter = 0;

const TONE_STYLE: Record<ToastTone, string> = {
  success: "border-sage/40 bg-white text-ink",
  error: "border-danger/40 bg-white text-ink",
  info: "border-line bg-white text-ink",
};

const TONE_ICON: Record<ToastTone, string> = {
  success: "✓",
  error: "!",
  info: "i",
};

const TONE_DOT: Record<ToastTone, string> = {
  success: "bg-sage text-white",
  error: "bg-danger text-white",
  info: "bg-clay text-white",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = ++counter;
      setToasts((list) => [...list, { id, message, tone }]);
      // Auto-dismiss; errors linger a little longer.
      setTimeout(() => remove(id), tone === "error" ? 6000 : 4000);
    },
    [remove]
  );

  const api: ToastApi = {
    toast,
    success: (m) => toast(m, "success"),
    error: (m) => toast(m, "error"),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`admin-rise pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${TONE_STYLE[t.tone]}`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${TONE_DOT[t.tone]}`}
              aria-hidden
            >
              {TONE_ICON[t.tone]}
            </span>
            <p className="flex-1 text-sm leading-relaxed">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 text-ink-faint hover:text-ink"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fail soft: outside a provider, toasts no-op instead of crashing.
    return { toast: () => {}, success: () => {}, error: () => {} };
  }
  return ctx;
}
