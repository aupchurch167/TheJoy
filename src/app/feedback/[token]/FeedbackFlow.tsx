"use client";

import { useState } from "react";
import { submitFeedback, submitCallback } from "../actions";

type ReviewUrls = { google: string; apfm: string };

const RATINGS = [
  { value: 1, label: "Not good" },
  { value: 2, label: "" },
  { value: 3, label: "Okay" },
  { value: 4, label: "" },
  { value: 5, label: "Wonderful" },
];

function ReviewButtons({
  urls,
  primary,
}: {
  urls: ReviewUrls;
  primary: boolean;
}) {
  const base =
    "flex min-h-[3.25rem] items-center justify-center rounded-2xl px-5 text-center font-semibold transition-colors";
  const cls = primary
    ? `${base} bg-clay text-white text-lg shadow-[0_2px_0_rgba(1,63,79,0.35)] hover:bg-clay-dark`
    : `${base} border border-clay/40 bg-white text-clay-dark hover:bg-clay/[0.06]`;
  return (
    <div className="grid gap-3">
      {urls.google && (
        <a href={urls.google} target="_blank" rel="noopener noreferrer" className={cls}>
          Review us on Google
        </a>
      )}
      {urls.apfm && (
        <a href={urls.apfm} target="_blank" rel="noopener noreferrer" className={cls}>
          Review us on A Place for Mom
        </a>
      )}
    </div>
  );
}

export default function FeedbackFlow({
  token,
  reviewUrls,
  phone,
}: {
  token: string;
  reviewUrls: ReviewUrls;
  phone: string;
}) {
  const [step, setStep] = useState<"survey" | "positive" | "concern" | "called">(
    "survey"
  );
  const [rating, setRating] = useState<number | null>(null);
  const [goingWell, setGoingWell] = useState("");
  const [couldBeBetter, setCouldBeBetter] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [responseId, setResponseId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Callback form.
  const [cbName, setCbName] = useState("");
  const [cbPhone, setCbPhone] = useState("");
  const [cbTime, setCbTime] = useState("");

  async function onSubmitSurvey(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) {
      setError("Please choose a rating first.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await submitFeedback({
        token,
        rating,
        goingWell,
        couldBeBetter,
        suggestions,
        anonymous,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResponseId(res.responseId);
      setStep(res.sentiment === "positive" ? "positive" : "concern");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmitCallback(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await submitCallback({
        responseId,
        name: cbName,
        phone: cbPhone,
        preferredTime: cbTime,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setStep("called");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-ink outline-none focus:border-clay";
  const labelCls = "text-sm font-medium text-ink-soft";

  return (
    <main className="flex flex-1 justify-center bg-paper">
      <div className="flex w-full max-w-[34rem] flex-col gap-8 px-6 pb-16 pt-10">
        <header className="flex flex-col gap-2">
          <p className="font-display text-2xl font-semibold leading-none text-ink">
            Joy <span className="text-clay">Senior Living</span>
          </p>
        </header>

        {/* Survey */}
        {step === "survey" && (
          <form onSubmit={onSubmitSurvey} className="flex flex-col gap-7">
            <div>
              <h1 className="font-display text-3xl font-semibold text-ink text-pretty">
                How is it going?
              </h1>
              <p className="mt-2 leading-relaxed text-ink-soft">
                Mellissa and the team read every note. Tell us honestly, the good
                and anything we could do better.
              </p>
            </div>

            <div>
              <p className={labelCls}>
                Overall, how has your experience with Joy been?
              </p>
              <div className="mt-3 flex gap-2">
                {RATINGS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRating(r.value)}
                    aria-pressed={rating === r.value}
                    className={`flex h-12 flex-1 items-center justify-center rounded-xl border text-lg font-semibold transition-colors ${
                      rating === r.value
                        ? "border-clay bg-clay text-white"
                        : "border-ink/15 bg-white text-ink-soft hover:border-clay/50"
                    }`}
                  >
                    {r.value}
                  </button>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-ink-faint">
                <span>Not good</span>
                <span>Wonderful</span>
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>What is going well?</span>
              <textarea
                value={goingWell}
                onChange={(e) => setGoingWell(e.target.value)}
                rows={3}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>What could be better?</span>
              <textarea
                value={couldBeBetter}
                onChange={(e) => setCouldBeBetter(e.target.value)}
                rows={3}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Anything you would suggest?</span>
              <textarea
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                rows={3}
                className={inputCls}
              />
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-ink/25 text-clay focus:ring-clay/30"
              />
              <span className="text-sm leading-relaxed text-ink-soft">
                Keep my responses anonymous. We will not tie these answers to your
                name. If you ask for a callback afterward, we use the name and
                phone you give there to reach you; your answers stay unlinked.
              </span>
            </label>

            {error && (
              <p className="text-sm font-medium text-danger" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex min-h-[3.5rem] items-center justify-center rounded-2xl bg-clay px-5 text-lg font-semibold text-white shadow-[0_2px_0_rgba(1,63,79,0.35)] transition-colors hover:bg-clay-dark disabled:opacity-60"
            >
              {busy ? "Sending…" : "Share with Joy"}
            </button>
          </form>
        )}

        {/* Positive thank-you (4-5): reviews are the primary ask */}
        {step === "positive" && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="font-display text-3xl font-semibold text-ink">
                Thank you.
              </h1>
              <p className="mt-3 leading-relaxed text-ink-soft">
                It means a lot to Mellissa and the team.
              </p>
              <p className="mt-3 leading-relaxed text-ink-soft">
                If you have two more minutes, a public review helps other families
                find us. Most people start their search on Google or A Place for
                Mom, and reviews from real families carry more weight than anything
                we could say about ourselves.
              </p>
            </div>
            <ReviewButtons urls={reviewUrls} primary />
          </div>
        )}

        {/* Concern thank-you (1-3): callback is the primary ask, reviews below */}
        {step === "concern" && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="font-display text-3xl font-semibold text-ink">
                Thank you for being honest with us.
              </h1>
              <p className="mt-3 leading-relaxed text-ink-soft">
                We want to hear more, and we want to make it right. Mellissa or
                someone on our team will call you personally.
              </p>
            </div>

            <form
              onSubmit={onSubmitCallback}
              className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-ink/10"
            >
              <label className="flex flex-col gap-1.5">
                <span className={labelCls}>Your name</span>
                <input
                  value={cbName}
                  onChange={(e) => setCbName(e.target.value)}
                  required
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelCls}>Phone</span>
                <input
                  type="tel"
                  value={cbPhone}
                  onChange={(e) => setCbPhone(e.target.value)}
                  required
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelCls}>Best time to reach you (optional)</span>
                <input
                  value={cbTime}
                  onChange={(e) => setCbTime(e.target.value)}
                  placeholder="e.g. weekday mornings"
                  className={inputCls}
                />
              </label>
              {error && (
                <p className="text-sm font-medium text-danger" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="flex min-h-[3.25rem] items-center justify-center rounded-2xl bg-clay px-5 text-lg font-semibold text-white shadow-[0_2px_0_rgba(1,63,79,0.35)] transition-colors hover:bg-clay-dark disabled:opacity-60"
              >
                {busy ? "Sending…" : "Ask for a call"}
              </button>
              <p className="text-xs text-ink-faint">
                Or call us now at{" "}
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="text-clay">
                  {phone}
                </a>
                .
              </p>
            </form>

            {(reviewUrls.google || reviewUrls.apfm) && (
              <div className="border-t border-ink/10 pt-5">
                <p className="mb-3 text-sm text-ink-faint">
                  If you would rather share your experience publicly, you can do
                  that here.
                </p>
                <ReviewButtons urls={reviewUrls} primary={false} />
              </div>
            )}
          </div>
        )}

        {/* Callback confirmed */}
        {step === "called" && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="font-display text-3xl font-semibold text-ink">
                Thank you. We will call you.
              </h1>
              <p className="mt-3 leading-relaxed text-ink-soft">
                Mellissa or someone on the team will be in touch personally. If you
                need us sooner, call{" "}
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="text-clay">
                  {phone}
                </a>
                .
              </p>
            </div>
            {(reviewUrls.google || reviewUrls.apfm) && (
              <div className="border-t border-ink/10 pt-5">
                <p className="mb-3 text-sm text-ink-faint">
                  If you would rather share your experience publicly, you can do
                  that here.
                </p>
                <ReviewButtons urls={reviewUrls} primary={false} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
