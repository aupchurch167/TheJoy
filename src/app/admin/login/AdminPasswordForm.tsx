"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input, Button } from "@/components/admin/ui";

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
      // Navigate with a RELATIVE path, not res.url: res.url is absolute and
      // built from Auth.js's base URL, which resolves to localhost when AUTH_URL
      // is unset in production. A relative push stays on the current domain.
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Could not sign in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full text-left">
      <Field label="Admin password" htmlFor="admin-password" error={error}>
        <Input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          error={!!error}
        />
      </Field>
      <Button type="submit" disabled={loading} className="mt-4 w-full">
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
