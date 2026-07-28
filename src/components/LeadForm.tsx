"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

type Status = "idle" | "submitting" | "success" | "error";

export default function LeadForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message,
          company: data.company, // honeypot
          consent: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      form.reset();
      track("Lead form submit");
      setStatus("success");
    } catch {
      setError(
        "We could not reach the server. Please call us at (470) 684-3569."
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-line">
        <p className="font-display text-2xl font-semibold text-ink">
          Thank you.
        </p>
        <p className="mt-3 text-ink-soft">
          We have your message and someone from Joy will be in touch soon. If
          you would like to talk now, call us at{" "}
          <a href="tel:+14706843569" className="font-semibold text-clay">
            (470) 684-3569
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-line"
      noValidate
    >
      <div className="grid gap-4">
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Your name</span>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-3 text-ink outline-none focus:border-clay"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-3 text-ink outline-none focus:border-clay"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">
              Phone <span className="text-ink-faint">(optional)</span>
            </span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-3 text-ink outline-none focus:border-clay"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-ink-soft">
            What are you looking for? <span className="text-ink-faint">(optional)</span>
          </span>
          <textarea
            name="message"
            rows={4}
            placeholder="Mom is 82, still at home, and we're starting to worry about the stairs."
            className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-3 text-ink outline-none focus:border-clay"
          />
        </label>

        {/* Honeypot: hidden from people, catches bots. */}
        <div aria-hidden="true" className="hidden">
          <label>
            Company
            <input name="company" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {status === "error" && (
          <p className="text-sm text-clay-dark" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="mt-1 inline-flex items-center justify-center rounded-full bg-clay px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-clay-dark disabled:opacity-60"
        >
          {status === "submitting" ? "Sending..." : "Send message"}
        </button>

        <p className="text-xs leading-relaxed text-ink-faint">
          By sending this, you agree we may email you about Joy. Every email has
          an unsubscribe link, and we never share your information.
        </p>
      </div>
    </form>
  );
}
