"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Field, Input, Button } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { sendSurvey } from "./actions";

export default function SendSurveyForm() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [resident, setResident] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await sendSurvey({
        familyName: name,
        familyEmail: email,
        residentFirstName: resident || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        toastError(res.error);
        return;
      }
      success(res.message);
      setName("");
      setEmail("");
      setResident("");
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>Send survey</Button>
    );
  }

  return (
    <Card className="mb-6">
      <form onSubmit={submit} className="grid gap-4">
        <p className="text-sm font-semibold text-ink">Send a feedback survey</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Family name" htmlFor="fb-name">
            <Input
              id="fb-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="The Miller family"
            />
          </Field>
          <Field label="Family email" htmlFor="fb-email">
            <Input
              id="fb-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </Field>
        </div>
        <Field
          label="Resident first name (optional)"
          htmlFor="fb-resident"
          hint="Used only to personalize the email greeting."
        >
          <Input
            id="fb-resident"
            value={resident}
            onChange={(e) => setResident(e.target.value)}
            placeholder="Dorothy"
          />
        </Field>
        {error && (
          <p className="text-sm font-medium text-danger" role="alert">
            {error}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send survey"}
          </Button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={pending}
            className="text-sm font-medium text-ink-faint underline underline-offset-2 hover:text-clay disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
