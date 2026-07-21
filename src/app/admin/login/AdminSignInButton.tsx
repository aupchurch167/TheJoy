"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function AdminSignInButton() {
  const [loading, setLoading] = useState(false);
  return (
    <button
      onClick={() => {
        setLoading(true);
        signIn("google", { callbackUrl: "/admin" });
      }}
      disabled={loading}
      className="inline-flex items-center justify-center gap-3 rounded-full bg-clay px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-clay-dark disabled:opacity-60"
    >
      {loading ? "Opening Google..." : "Sign in with Google"}
    </button>
  );
}
