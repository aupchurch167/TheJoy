import type { Metadata } from "next";
import { hasDatabase } from "@/lib/db";
import { unsubscribeByToken } from "@/lib/leads";
import { BUSINESS } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let state: "done" | "invalid" | "error" = "invalid";
  if (token && hasDatabase()) {
    try {
      const ok = await unsubscribeByToken(token);
      state = ok ? "done" : "invalid";
    } catch {
      state = "error";
    }
  }

  const message =
    state === "done"
      ? "You are unsubscribed. You will not receive any more emails from us."
      : state === "error"
        ? "We could not process that just now. Please email us and we will remove you by hand."
        : "That unsubscribe link is not valid or has already been used.";

  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold text-ink">
        {BUSINESS.name}
      </h1>
      <p className="mt-6 text-lg text-ink-soft">{message}</p>
      <p className="mt-8 text-sm text-ink-faint">
        Questions? Email{" "}
        <a href={BUSINESS.emailHref} className="text-clay hover:underline">
          {BUSINESS.email}
        </a>{" "}
        or call {BUSINESS.phone}.
      </p>
    </div>
  );
}
