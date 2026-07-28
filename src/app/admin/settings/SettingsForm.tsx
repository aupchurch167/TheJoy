"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSiteSettings } from "./actions";
import { SETTING_META, type SettingKey } from "@/lib/settings-meta";
import {
  Card,
  Field,
  Input,
  Textarea,
  SectionLabel,
  Button,
} from "@/components/admin/ui";
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

  function set(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

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
        {initial.map((s, i) => {
          const meta = SETTING_META[s.key];
          const value = values[s.key] ?? "";
          // Group header whenever the group changes from the previous field.
          const prevGroup = i > 0 ? SETTING_META[initial[i - 1].key]?.group : null;
          const showGroup = meta?.group && meta.group !== prevGroup;

          return (
            <Fragment key={s.key}>
              {showGroup && (
                <div className={i > 0 ? "border-t border-line pt-5" : ""}>
                  <SectionLabel>{meta.group}</SectionLabel>
                </div>
              )}

              {meta?.type === "bool" ? (
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={value === "on"}
                    onChange={(e) => set(s.key, e.target.checked ? "on" : "")}
                    className="mt-0.5 h-5 w-5 rounded border-line text-clay focus:ring-clay/30"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">
                      {meta.label}
                    </span>
                    {meta.hint && (
                      <span className="mt-0.5 block text-xs text-ink-faint">
                        {meta.hint}
                      </span>
                    )}
                  </span>
                </label>
              ) : (
                <Field
                  label={meta?.label ?? s.key}
                  htmlFor={`setting-${s.key}`}
                  hint={meta?.hint}
                >
                  {meta?.type === "textarea" ? (
                    <Textarea
                      id={`setting-${s.key}`}
                      rows={2}
                      value={value}
                      onChange={(e) => set(s.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      id={`setting-${s.key}`}
                      type="text"
                      value={value}
                      onChange={(e) => set(s.key, e.target.value)}
                      placeholder={
                        meta?.type === "url" ? "https://… or /page" : undefined
                      }
                    />
                  )}
                </Field>
              )}
            </Fragment>
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
