"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendDepositRequest } from "./actions";
import { Card, Field, Input, Textarea, Button, SectionLabel } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";

/**
 * Send-a-deposit form. Pre-fills the amount (and any note) from Site Settings,
 * but every field is editable per request. On success it clears the name/email
 * (keeping the default amount) and refreshes the history table below.
 */
export default function DepositForm({
  enabled,
  defaultAmount,
  defaultNote,
}: {
  enabled: boolean;
  defaultAmount: string;
  defaultNote: string;
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState(defaultAmount);
  const [note, setNote] = useState(defaultNote);
  const [pending, start] = useTransition();

  const canSend =
    enabled && name.trim() !== "" && email.trim() !== "" && amount.trim() !== "";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    start(async () => {
      const res = await sendDepositRequest({ name, email, amount, note });
      if (!res.ok) {
        toastError(res.error);
        return;
      }
      success(res.message);
      setName("");
      setEmail("");
      setAmount(defaultAmount);
      setNote(defaultNote);
      router.refresh();
    });
  }

  return (
    <Card>
      <SectionLabel>New deposit request</SectionLabel>
      <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Family member's name" htmlFor="dep-name" required>
          <Input
            id="dep-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Karen Mitchell"
            autoComplete="off"
            disabled={!enabled}
          />
        </Field>
        <Field label="Email" htmlFor="dep-email" required>
          <Input
            id="dep-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="family@example.com"
            autoComplete="off"
            disabled={!enabled}
          />
        </Field>
        <Field
          label="Deposit amount (USD)"
          htmlFor="dep-amount"
          hint="Pre-filled from your default. Change it for this family if needed."
          required
        >
          <Input
            id="dep-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500"
            disabled={!enabled}
          />
        </Field>
        <Field
          label="Note to the family (optional)"
          htmlFor="dep-note"
          hint="Shown on the PayPal invoice."
        >
          <Textarea
            id="dep-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Move-in deposit to hold your room."
            disabled={!enabled}
          />
        </Field>
        <div className="sm:col-span-2 flex items-center justify-between gap-3">
          <p className="text-xs text-ink-faint">
            We email a secure payment link from hello@joyseniorcare.com; PayPal
            tracks payment. Nothing is charged here.
          </p>
          <Button type="submit" disabled={!canSend || pending}>
            {pending ? "Sending…" : "Send deposit request"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
