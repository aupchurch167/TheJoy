"use client";

import { useState } from "react";
import type { SurveyQuestion } from "@/lib/employee-feedback";
import { submitPulse } from "../actions";
import { BUSINESS } from "@/lib/site";

const RATING_LABELS = ["", "Not at all", "A little", "Okay", "Good", "Great"];

function Wordmark({ logo }: { logo: { src: string; set: boolean } }) {
  if (logo.set) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo.src} alt={BUSINESS.name} className="h-10 w-auto" />
    );
  }
  return (
    <p className="font-display text-2xl font-semibold italic leading-none text-clay">
      Joy
    </p>
  );
}

export default function PulseForm({
  token,
  title,
  intro,
  questions,
  anonymous,
  logo,
}: {
  token: string;
  title: string;
  intro: string;
  questions: SurveyQuestion[];
  anonymous: boolean;
  logo: { src: string; set: boolean };
}) {
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const ratingQs = questions.filter((q) => q.type === "rating");
  const allRated = ratingQs.every((q) => typeof answers[q.key] === "number");

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await submitPulse({ token, answers });
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(res.error);
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6">
        <div className="max-w-md py-24 text-center">
          <div className="mb-4 text-4xl">💙</div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Thank you.
          </h1>
          <p className="mt-3 leading-relaxed text-ink-soft">
            {anonymous
              ? "Your check-in came in anonymously. It genuinely helps us make Joy a better place to work."
              : "Your check-in is in. Mellissa will read it and may follow up with you."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <Wordmark logo={logo} />
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              anonymous ? "bg-sage/15 text-sage" : "bg-surface text-ink-soft"
            }`}
          >
            {anonymous ? "Anonymous" : "Named"}
          </span>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
          {intro && (
            <p className="mt-2 whitespace-pre-wrap leading-relaxed text-ink-soft">
              {intro}
            </p>
          )}
          <p className="mt-2 text-sm text-ink-faint">
            {anonymous
              ? "Your answers are anonymous. We cannot see who said what, so please be candid."
              : "Your answers come back with your name so we can follow up."}
          </p>

          <div className="mt-6 space-y-7">
            {questions.map((q) => (
              <div key={q.key}>
                <label className="block text-[15px] font-semibold text-ink">
                  {q.label}
                </label>
                {q.type === "rating" ? (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const on = answers[q.key] === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() =>
                            setAnswers((a) => ({ ...a, [q.key]: n }))
                          }
                          aria-pressed={on}
                          className={`flex min-h-[52px] flex-1 flex-col items-center justify-center rounded-xl border px-2 py-1.5 transition-colors ${
                            on
                              ? "border-clay bg-clay/[0.08] text-clay-dark"
                              : "border-line bg-white text-ink-soft hover:bg-paper"
                          }`}
                        >
                          <span className="text-lg font-bold">{n}</span>
                          <span className="text-[10px] leading-tight">
                            {RATING_LABELS[n]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    className="mt-2 min-h-[92px] w-full resize-y rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/25"
                    placeholder="Optional"
                    value={(answers[q.key] as string) ?? ""}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [q.key]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <p className="mt-5 rounded-lg bg-danger/[0.08] px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={busy || !allRated}
            className="mt-7 min-h-[48px] w-full rounded-xl bg-clay text-[15px] font-bold text-white shadow-[0_2px_8px_rgba(1,167,206,0.35)] transition-opacity hover:opacity-95 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Submit check-in"}
          </button>
          {!allRated && ratingQs.length > 0 && (
            <p className="mt-2 text-center text-xs text-ink-faint">
              Please answer the rating questions to submit.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
