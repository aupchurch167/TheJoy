"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

/**
 * Username + password sign-in. On success Auth.js sets the session and we send
 * the admin to /admin; on failure we show an inline message (no redirect loop).
 */
export default function CredentialsSignInForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError("That username or password is not right.");
      setLoading(false);
      return;
    }
    // Full navigation so the new session cookie is picked up server-side.
    window.location.href = "/admin";
  }

  const inputClass =
    "h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-faint focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30";

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-left">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}
      <div>
        <label
          htmlFor="username"
          className="mb-1 block text-sm font-medium text-ink"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-ink"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-clay px-4 text-sm font-semibold text-white transition-colors hover:bg-clay-dark disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
