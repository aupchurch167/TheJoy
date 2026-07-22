"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSiteSettings } from "./actions";
import { SETTING_META, type SettingKey } from "@/lib/settings-meta";

export default function SettingsForm({
  initial,
}: {
  initial: { key: SettingKey; value: string }[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(initial.map((s) => [s.key, s.value]))
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    const entries = initial.map((s) => ({ key: s.key, value: values[s.key] ?? "" }));
    start(async () => {
      const res = await saveSiteSettings(entries);
      if (!res.ok) return setError(res.error);
      setMessage(res.message);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSave} className="grid gap-5">
      {initial.map((s) => {
        const meta = SETTING_META[s.key];
        return (
          <label key={s.key} className="block">
            <span className="text-sm font-medium text-ink-soft">
              {meta?.label ?? s.key}
            </span>
            {meta?.hint && (
              <span className="ml-2 text-xs text-ink-faint">{meta.hint}</span>
            )}
            <input
              type={meta?.type === "url" ? "url" : "text"}
              value={values[s.key] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [s.key]: e.target.value }))
              }
              placeholder={
                meta?.type === "url" ? "https://..." : undefined
              }
              className="mt-1 w-full rounded-lg border border-line bg-white px-4 py-2.5 text-ink outline-none focus:border-clay"
            />
          </label>
        );
      })}

      {(message || error) && (
        <p
          role="status"
          className={`rounded-lg px-4 py-2.5 text-sm ${
            error ? "bg-clay/10 text-clay-dark" : "bg-sage/15 text-sage"
          }`}
        >
          {error || message}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-clay px-6 py-2.5 text-sm font-semibold text-white hover:bg-clay-dark disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}
