"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import { Card, Button, Input, SectionLabel } from "@/components/admin/ui";
import type { SurveyQuestion, QuestionType } from "@/lib/employee-feedback";
import { createSurveyAction } from "../actions";

type Q = SurveyQuestion & { uid: number };

let counter = 0;
const withUid = (q: SurveyQuestion): Q => ({ ...q, uid: counter++ });

// A key derived from the label, so answers map to something readable.
function keyFor(label: string, uid: number): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
  return base || `q_${uid}`;
}

export default function SurveyComposer({
  defaultQuestions,
}: {
  defaultQuestions: SurveyQuestion[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [intro, setIntro] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [questions, setQuestions] = useState<Q[]>(defaultQuestions.map(withUid));
  const [busy, setBusy] = useState(false);

  const setQ = (uid: number, patch: Partial<Q>) =>
    setQuestions((qs) => qs.map((q) => (q.uid === uid ? { ...q, ...patch } : q)));
  const removeQ = (uid: number) =>
    setQuestions((qs) => qs.filter((q) => q.uid !== uid));
  const addQ = (type: QuestionType) =>
    setQuestions((qs) => [...qs, withUid({ key: "", label: "", type })]);

  async function create() {
    const cleaned = questions
      .map((q) => ({ ...q, label: q.label.trim() }))
      .filter((q) => q.label);
    if (!title.trim()) {
      toast.error("Give the survey a title.");
      return;
    }
    if (cleaned.length === 0) {
      toast.error("Add at least one question.");
      return;
    }
    // Derive unique keys from labels.
    const seen = new Set<string>();
    const payload: SurveyQuestion[] = cleaned.map((q) => {
      let key = keyFor(q.label, q.uid);
      while (seen.has(key)) key = `${key}_${q.uid}`;
      seen.add(key);
      return { key, label: q.label, type: q.type };
    });

    setBusy(true);
    const res = await createSurveyAction({
      title: title.trim(),
      intro: intro.trim(),
      anonymous,
      questions: payload,
    });
    setBusy(false);
    if (res.ok && res.id) {
      toast.success(res.message ?? "Created.");
      router.push(`/admin/team/${res.id}`);
    } else if (!res.ok) {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <SectionLabel>The basics</SectionLabel>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="August team check-in"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">
              Intro (optional)
            </label>
            <textarea
              className="min-h-[80px] w-full resize-y rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/25"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder="A quick note about why you're asking and how it'll be used."
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <SectionLabel>Anonymity</SectionLabel>
          <div className="flex rounded-[9px] bg-surface p-[3px]">
            {[
              { v: true, label: "Anonymous" },
              { v: false, label: "Named" },
            ].map((o) => (
              <button
                key={String(o.v)}
                type="button"
                onClick={() => setAnonymous(o.v)}
                className={`rounded-[7px] px-3 py-1.5 text-sm font-semibold transition-colors ${
                  anonymous === o.v
                    ? "bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                    : "text-ink-soft"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-sm text-ink-faint">
          {anonymous
            ? "Responses are not linked to a person. You'll see aggregate results and response rate, but not who said what."
            : "Responses come back with the employee's name, so you can follow up directly."}
        </p>
      </Card>

      <Card>
        <SectionLabel>Questions</SectionLabel>
        <div className="mt-4 space-y-3">
          {questions.map((q, i) => (
            <div
              key={q.uid}
              className="rounded-lg border border-line bg-paper p-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink-faint">
                  {i + 1}.
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    q.type === "rating"
                      ? "bg-clay/[0.12] text-clay-dark"
                      : "bg-surface text-ink-soft"
                  }`}
                >
                  {q.type === "rating" ? "1–5 rating" : "Written"}
                </span>
                <button
                  type="button"
                  onClick={() => removeQ(q.uid)}
                  className="ml-auto text-[11px] font-semibold text-danger hover:underline"
                >
                  Remove
                </button>
              </div>
              <Input
                className="mt-2"
                value={q.label}
                onChange={(e) => setQ(q.uid, { label: e.target.value })}
                placeholder={
                  q.type === "rating"
                    ? "How supported do you feel?"
                    : "What would make Joy a better place to work?"
                }
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => addQ("rating")}>
            ＋ Rating question
          </Button>
          <Button variant="secondary" size="sm" onClick={() => addQ("text")}>
            ＋ Written question
          </Button>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button onClick={create} disabled={busy}>
          {busy ? "Creating…" : "Create survey"}
        </Button>
      </div>
    </div>
  );
}
