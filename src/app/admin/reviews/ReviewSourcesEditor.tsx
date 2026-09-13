"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Card, Field, Input, SectionLabel } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { REVIEW_SOURCE_LABEL, type ReviewSource } from "@/lib/reviews-vocab";
import { saveReviewSource } from "./actions";

// The platforms we always show a row for, even before one exists.
const DEFAULT_SOURCES = ["google", "apfm", "caring"] as const;

type Draft = {
  source: string;
  label: string;
  profile_url: string;
  rating_value: string;
  badge_label: string;
  enabled: boolean;
};

function toDraft(source: string, existing?: ReviewSource): Draft {
  return {
    source,
    label: existing?.label ?? REVIEW_SOURCE_LABEL[source] ?? source,
    profile_url: existing?.profile_url ?? "",
    rating_value: existing?.rating_value ?? "",
    badge_label: existing?.badge_label ?? "",
    enabled: existing?.enabled ?? true,
  };
}

export default function ReviewSourcesEditor({
  sources,
}: {
  sources: ReviewSource[];
}) {
  const byKey = new Map(sources.map((s) => [s.source, s]));
  const keys = Array.from(
    new Set<string>([...DEFAULT_SOURCES, ...sources.map((s) => s.source)])
  );

  return (
    <div>
      <SectionLabel>Profiles &amp; badges</SectionLabel>
      <p className="mb-4 mt-1 text-sm text-ink-soft">
        The &ldquo;read them in full&rdquo; links and the rating/award chips shown
        on the public reviews page. These can also be populated by an integration.
      </p>
      <div className="space-y-3">
        {keys.map((key) => (
          <SourceRow key={key} draft={toDraft(key, byKey.get(key))} />
        ))}
      </div>
    </div>
  );
}

function SourceRow({ draft }: { draft: Draft }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [d, setD] = useState<Draft>(draft);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const res = await saveReviewSource(d);
      if (!res.ok) {
        toastError(res.error);
        return;
      }
      success(`${d.label} saved.`);
      router.refresh();
    });
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">
          {REVIEW_SOURCE_LABEL[d.source] ?? d.source}
        </h3>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={d.enabled}
            onChange={(e) => setD({ ...d, enabled: e.target.checked })}
            className="h-4 w-4 accent-clay"
          />
          Shown on site
        </label>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Profile URL">
          <Input
            value={d.profile_url}
            onChange={(e) => setD({ ...d, profile_url: e.target.value })}
            placeholder="https://www.google.com/…"
          />
        </Field>
        <Field label="Link label">
          <Input
            value={d.label}
            onChange={(e) => setD({ ...d, label: e.target.value })}
          />
        </Field>
        <Field label="Rating chip (optional)">
          <Input
            value={d.rating_value}
            onChange={(e) => setD({ ...d, rating_value: e.target.value })}
            placeholder="e.g. 4.9"
          />
        </Field>
        <Field label="Badge label (optional)">
          <Input
            value={d.badge_label}
            onChange={(e) => setD({ ...d, badge_label: e.target.value })}
            placeholder="e.g. Best of Senior Living"
          />
        </Field>
      </div>
      <div className="mt-3">
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </Card>
  );
}
