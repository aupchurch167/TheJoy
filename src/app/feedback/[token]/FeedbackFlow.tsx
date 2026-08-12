"use client";

import { useState } from "react";
import { submitFeedback, submitCallback } from "../actions";

type ReviewUrls = { google: string; apfm: string };
type Recommend = "definitely" | "probably" | "not_sure" | "no";
type DimKey = "care" | "communication" | "dining" | "home_feel" | "engagement";

const HEART_LABELS: Record<number, string> = {
  1: "Not good",
  2: "Below what we hoped",
  3: "Okay",
  4: "Good",
  5: "Wonderful",
};

const DIM_BTNS = [
  { label: "Great", value: 3 },
  { label: "Okay", value: 2 },
  { label: "Needs work", value: 1 },
];

const RECOMMEND: { key: Recommend; label: string }[] = [
  { key: "definitely", label: "Definitely" },
  { key: "probably", label: "Probably" },
  { key: "not_sure", label: "Not sure" },
  { key: "no", label: "No" },
];

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg width="34" height="31" viewBox="0 0 24 22" aria-hidden>
      <path
        d="M12 20.3 3.6 12A5.6 5.6 0 0 1 12 4.6 5.6 5.6 0 0 1 20.4 12Z"
        fill={filled ? "var(--clay)" : "none"}
        stroke={filled ? "var(--clay)" : "#c9c3b8"}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FeedbackFlow({
  token,
  reviewUrls,
  phone,
  residentName,
  logo,
}: {
  token: string;
  reviewUrls: ReviewUrls;
  phone: string;
  residentName: string;
  logo: { src: string; set: boolean };
}) {
  const who = residentName || "your family member";
  const [step, setStep] = useState<"survey" | "positive" | "concern" | "called">(
    "survey"
  );
  const [rating, setRating] = useState<number | null>(null);
  const [dims, setDims] = useState<Record<DimKey, number | null>>({
    care: null,
    communication: null,
    dining: null,
    home_feel: null,
    engagement: null,
  });
  const [recommend, setRecommend] = useState<Recommend | null>(null);
  const [goingWell, setGoingWell] = useState("");
  const [couldBeBetter, setCouldBeBetter] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [responseId, setResponseId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [cbName, setCbName] = useState("");
  const [cbPhone, setCbPhone] = useState("");
  const [cbTime, setCbTime] = useState("");

  const DIMENSIONS: { key: DimKey; q: string }[] = [
    { key: "care", q: `The care ${who} receives` },
    { key: "communication", q: "How well we communicate with you" },
    { key: "dining", q: "Meals and dining" },
    { key: "home_feel", q: "How much Joy feels like home" },
    { key: "engagement", q: "Activities and daily engagement" },
  ];

  function setDim(key: DimKey, value: number) {
    setDims((d) => ({ ...d, [key]: d[key] === value ? null : value }));
  }

  async function onSubmitSurvey(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) {
      setError("Tap a heart above to send.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await submitFeedback({
        token,
        rating,
        dimensions: dims,
        recommend,
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

  const card = "rounded-2xl bg-white p-6 ring-1 ring-line";
  const label = "text-sm font-medium text-ink-soft";
  const inputCls =
    "w-full rounded-xl border border-ink/15 bg-surface px-3.5 py-3 text-ink outline-none focus:border-clay focus:ring-2 focus:ring-clay/25";
  const pill = (on: boolean) =>
    `min-h-[2.9rem] rounded-xl border px-2 text-sm font-semibold transition-colors ${
      on
        ? "border-clay bg-clay text-white"
        : "border-ink/15 bg-surface text-ink-soft hover:border-clay/50"
    }`;
  const telHref = `tel:${phone.replace(/[^\d+]/g, "")}`;

  return (
    <main className="flex flex-1 justify-center bg-paper">
      <div className="flex w-full max-w-[35rem] flex-col gap-4 px-5 pb-16 pt-10">
        <header className="text-center">
          {logo.set ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo.src}
              alt="Joy Senior Living"
              className="mx-auto h-12 w-auto"
            />
          ) : (
            <>
              <p className="font-display text-3xl font-semibold italic leading-none text-clay">
                Joy
              </p>
              <p className="mt-1.5 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-ink-faint">
                Senior Living · Personal Care Home
              </p>
            </>
          )}
        </header>

        {/* SURVEY */}
        {step === "survey" && (
          <form onSubmit={onSubmitSurvey} className="flex flex-col gap-3">
            <div className="mt-2 text-center">
              <h1 className="font-display text-3xl font-semibold text-ink text-pretty">
                How are things going?
              </h1>
              <p className="mx-auto mt-2.5 max-w-md leading-relaxed text-ink-soft">
                Your answers help Mellissa and the team take better care of {who}.
                It takes about two minutes.
              </p>
            </div>

            {/* Card 1: overall hearts */}
            <div className={`${card} text-center`}>
              <p className="text-lg font-semibold text-ink">
                Overall, how has your experience with Joy been?
              </p>
              <div className="mt-4 flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setRating(n);
                      setError("");
                    }}
                    aria-label={`${n} of 5`}
                    aria-pressed={rating === n}
                    className="flex h-14 w-14 items-center justify-center rounded-full transition-transform hover:scale-110"
                  >
                    <Heart filled={rating != null && n <= rating} />
                  </button>
                ))}
              </div>
              <p className="mt-2 h-5 text-base font-semibold text-clay">
                {rating ? HEART_LABELS[rating] : ""}
              </p>
            </div>

            {/* Card 2: dimensions + recommend */}
            <div className={card}>
              <p className="text-lg font-semibold text-ink">A little more detail</p>
              <p className="mt-1 text-sm text-ink-faint">
                Tap to answer. Every question is optional.
              </p>
              <div className="mt-4 flex flex-col gap-5">
                {DIMENSIONS.map((row) => (
                  <div key={row.key}>
                    <p className="text-[0.95rem] text-ink">{row.q}</p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {DIM_BTNS.map((b) => (
                        <button
                          key={b.value}
                          type="button"
                          onClick={() => setDim(row.key, b.value)}
                          className={pill(dims[row.key] === b.value)}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-line pt-5">
                <p className="text-[0.95rem] text-ink">
                  Would you recommend Joy to another family?
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {RECOMMEND.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() =>
                        setRecommend((cur) => (cur === r.key ? null : r.key))
                      }
                      className={pill(recommend === r.key)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 3: in your words */}
            <div className={card}>
              <p className="text-lg font-semibold text-ink">In your words</p>
              <p className="mt-1 text-sm text-ink-faint">
                Optional. Even a sentence helps.
              </p>
              <div className="mt-4 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className={label}>What is going well?</span>
                  <textarea
                    rows={3}
                    value={goingWell}
                    onChange={(e) => setGoingWell(e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={label}>What could be better?</span>
                  <textarea
                    rows={3}
                    value={couldBeBetter}
                    onChange={(e) => setCouldBeBetter(e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={label}>Anything you would suggest?</span>
                  <textarea
                    rows={3}
                    value={suggestions}
                    onChange={(e) => setSuggestions(e.target.value)}
                    className={inputCls}
                  />
                </label>
              </div>
            </div>

            {/* Footer: anonymity + submit */}
            <label className="flex items-start gap-3 px-1 pt-2">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-ink/25 text-clay focus:ring-clay/30"
              />
              <span className="text-[0.9rem] leading-relaxed text-ink-soft">
                <strong className="font-semibold text-ink">
                  Keep my responses anonymous.
                </strong>{" "}
                We will see your answers but not your name. If you later ask us to
                call you, we will have your name and number for the call only.
              </span>
            </label>

            <button
              type="submit"
              disabled={busy || !rating}
              className="mt-1 flex min-h-[3.5rem] items-center justify-center rounded-2xl bg-clay px-5 text-lg font-semibold text-white shadow-[0_2px_0_rgba(1,63,79,0.35)] transition-colors hover:bg-clay-dark disabled:bg-ink-faint/50 disabled:shadow-none"
            >
              {busy ? "Sending…" : "Send my answers"}
            </button>
            <p className="min-h-4 text-center text-sm text-ink-faint" role="alert">
              {error || (!rating ? "Tap a heart above to send." : "")}
            </p>
            <p className="mt-1 text-center text-xs text-ink-faint">
              Joy Senior Living · A personal care home
            </p>
          </form>
        )}

        {/* POSITIVE: review-first (no callback) */}
        {step === "positive" && (
          <div className={`${card} mt-2 flex flex-col items-center gap-5 text-center`}>
            <span className="text-clay">
              <Heart filled />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink">
                Thank you. It means a lot to Mellissa and the team.
              </h1>
              <p className="mt-3 leading-relaxed text-ink-soft">
                If you have two more minutes, a public review helps other families
                find us. Most people start their search on Google or A Place for
                Mom. Reviews from real families carry more weight than anything we
                could say about ourselves.
              </p>
            </div>
            <div className="grid w-full max-w-[21rem] gap-3">
              {reviewUrls.google && (
                <a
                  href={reviewUrls.google}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[3.25rem] items-center justify-center rounded-2xl bg-clay px-5 text-lg font-semibold text-white shadow-[0_2px_0_rgba(1,63,79,0.35)] hover:bg-clay-dark"
                >
                  Review us on Google
                </a>
              )}
              {reviewUrls.apfm && (
                <a
                  href={reviewUrls.apfm}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[3.25rem] items-center justify-center rounded-2xl border-[1.5px] border-clay bg-white px-5 text-lg font-semibold text-clay-dark hover:bg-clay/[0.06]"
                >
                  Review us on A Place for Mom
                </a>
              )}
            </div>
          </div>
        )}

        {/* CONCERN: callback only (no review links) */}
        {step === "concern" && (
          <div className="mt-2 flex flex-col gap-4">
            <div className="text-center">
              <h1 className="font-display text-2xl font-semibold text-ink">
                Thank you for being honest with us.
              </h1>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-ink-soft">
                We want to hear more, and we want to make it right. Mellissa or
                someone on our team will call you personally.
              </p>
            </div>
            <form onSubmit={onSubmitCallback} className={`${card} flex flex-col gap-4`}>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Your name</span>
                <input
                  value={cbName}
                  onChange={(e) => setCbName(e.target.value)}
                  required
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Phone number</span>
                <input
                  type="tel"
                  value={cbPhone}
                  onChange={(e) => setCbPhone(e.target.value)}
                  required
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Best time to call (optional)</span>
                <input
                  value={cbTime}
                  onChange={(e) => setCbTime(e.target.value)}
                  placeholder="Mornings, after 3pm, weekends…"
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
                {busy ? "Sending…" : "Please call me"}
              </button>
            </form>
          </div>
        )}

        {/* CALLBACK CONFIRMED */}
        {step === "called" && (
          <div className={`${card} mt-2 text-center`}>
            <h1 className="font-display text-2xl font-semibold text-ink">
              Got it. We will call you soon.
            </h1>
            <p className="mt-3 leading-relaxed text-ink-soft">
              If it is easier, you can also reach us at{" "}
              <a href={telHref} className="font-semibold text-clay">
                {phone}
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
