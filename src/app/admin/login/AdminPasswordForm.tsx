"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("password", {
        password,
        redirect: false,
        callbackUrl: "/admin",
      });
      if (!res || res.error) {
        setError("Incorrect password.");
        setLoading(false);
        return;
      }
      router.push(res.url || "/admin");
      router.refresh();
    } catch {
      setError("Could not sign in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 w-full max-w-xs">
      <label className="block text-left">
        <span className="text-sm font-medium text-ink-soft">Admin password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-line bg-white px-4 py-2.5 text-ink outline-none focus:border-clay"
        />
      </label>
      {error && (
        <p className="mt-2 text-left text-sm text-clay-dark" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-3 w-full rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in with password"}
      </button>
    </form>
  );
}
