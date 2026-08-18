"use client";

import { useState, useTransition } from "react";
import { submitRsvp } from "./actions";

const INPUT =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-faint focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30";

export default function RsvpForm({ token }: { token: string }) {
  const [response, setResponse] = useState<"yes" | "no" | "maybe">("yes");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | "yes" | "no" | "maybe">(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await submitRsvp({ token, name, email, phone, response, guests, note });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(res.response);
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-line bg-white p-6 text-center shadow-sm">
        <div className="text-3xl">{done === "no" ? "💙" : "🎉"}</div>
        <p className="mt-2 text-lg font-medium text-ink">
          {done === "yes"
            ? "You're on the list. Thank you!"
            : done === "maybe"
              ? "Thanks for letting us know. We hope you can make it."
              : "Thank you for letting us know."}
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          Need to change your answer? Just fill the form in again.
        </p>
        <button
          type="button"
          onClick={() => setDone(null)}
          className="mt-4 text-sm font-medium text-clay underline underline-offset-2 hover:text-clay-dark"
        >
          Update my RSVP
        </button>
      </div>
    );
  }

  const OPTIONS: { value: "yes" | "no" | "maybe"; label: string }[] = [
    { value: "yes", label: "I'll be there" },
    { value: "maybe", label: "Maybe" },
    { value: "no", label: "Can't make it" },
  ];

  return (
    <form onSubmit={submit} className="rounded-xl border border-line bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-ink">Will you join us?</p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setResponse(o.value)}
            className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              response === o.value
                ? "border-clay bg-clay text-white"
                : "border-line bg-white text-ink-soft hover:bg-surface"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        <label className="block">
          <span className="text-sm font-medium text-ink">Your name</span>
          <input
            className={`${INPUT} mt-1`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sarah Miller"
            required
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink">Email</span>
            <input
              type="email"
              className={`${INPUT} mt-1`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Phone (optional)</span>
            <input
              className={`${INPUT} mt-1`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(404) 555-0100"
            />
          </label>
        </div>

        {response === "yes" && (
          <label className="block">
            <span className="text-sm font-medium text-ink">
              Bringing anyone? How many extra guests
            </span>
            <input
              type="number"
              min={0}
              max={20}
              className={`${INPUT} mt-1 sm:max-w-[10rem]`}
              value={guests}
              onChange={(e) => setGuests(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
        )}

        <label className="block">
          <span className="text-sm font-medium text-ink">
            Anything you&apos;d like us to know? (optional)
          </span>
          <textarea
            rows={3}
            className={`${INPUT} mt-1`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Dietary needs, a question, or a note for the team."
          />
        </label>
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-lg bg-clay px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-clay-dark disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send my RSVP"}
      </button>
    </form>
  );
}
