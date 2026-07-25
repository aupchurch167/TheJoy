"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSiteSettings } from "./actions";
import { SETTING_META, type SettingKey } from "@/lib/settings-meta";
import { Card, Field, Input, Button } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";

export default function SettingsForm({
  initial,
}: {
  initial: { key: SettingKey; value: string }[];
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(initial.map((s) => [s.key, s.value]))
  );
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const entries = initial.map((s) => ({ key: s.key, value: values[s.key] ?? "" }));
    start(async () => {
      const res = await saveSiteSettings(entries);
      if (!res.ok) {
        setError(res.error);
        toastError(res.error);
        return;
      }
      success(res.message || "Settings saved.");
      router.refresh();
    });
  }

  return (
    <Card>
      <form onSubmit={onSave} className="grid gap-5">
        {initial.map((s) => {
          const meta = SETTING_META[s.key];
          return (
            <Field
              key={s.key}
              label={meta?.label ?? s.key}
              htmlFor={`setting-${s.key}`}
              hint={meta?.hint}
            >
              <Input
                id={`setting-${s.key}`}
                type={meta?.type === "url" ? "url" : "text"}
                value={values[s.key] ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [s.key]: e.target.value }))
                }
                placeholder={meta?.type === "url" ? "https://…" : undefined}
              />
            </Field>
          );
        })}

        {error && (
          <p className="text-sm font-medium text-danger" role="alert">
            {error}
          </p>
        )}

        <div className="border-t border-line pt-5">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
