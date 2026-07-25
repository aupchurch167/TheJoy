"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addFamilyMember, removeFamilyMember } from "./actions";
import type { Lead } from "@/lib/leads";
import { formatDate, orDash } from "@/lib/format";
import {
  Card,
  Field,
  Input,
  Button,
  Badge,
  EmptyState,
  TableWrap,
  Th,
  Td,
  SectionLabel,
} from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { useToast } from "@/components/admin/Toast";

export default function FamilyManager({ members }: { members: Lead[] }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await addFamilyMember({ name, email, optIn });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setName("");
      setEmail("");
      setOptIn(false);
      success(`${name.trim() || "Family member"} added to the list.`);
      router.refresh();
    });
  }

  async function onRemove(id: string, memberName: string) {
    const res = await removeFamilyMember(id);
    if (res && "ok" in res && !res.ok) {
      toastError("Could not remove that person. Please try again.");
      return;
    }
    success(`${memberName} removed from the family list.`);
    router.refresh();
  }

  return (
    <div>
      <Card>
        <SectionLabel>Add a family member</SectionLabel>
        <form onSubmit={onAdd} className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="fm-name">
              <Input
                id="fm-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
              />
            </Field>
            <Field label="Email" htmlFor="fm-email">
              <Input
                id="fm-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </Field>
          </div>

          <label className="mt-4 flex items-start gap-2.5 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={optIn}
              onChange={(e) => setOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-clay"
            />
            <span>
              This family member agreed to receive community emails from Joy
              (invitations, a monthly note, event photos). They can unsubscribe
              anytime.
            </span>
          </label>

          {error && (
            <p className="mt-3 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          )}

          <div className="mt-5">
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add family member"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-8">
        <SectionLabel>
          On the list {members.length > 0 && `(${members.length})`}
        </SectionLabel>
        <div className="mt-3">
          {members.length === 0 ? (
            <EmptyState
              icon="👪"
              title="No family members yet"
              description="Add a resident's family member above to include them in community emails. Add them only with their permission."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr className="border-b border-line">
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Added</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {members.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-surface">
                    <Td className="font-medium text-ink">{orDash(m.name)}</Td>
                    <Td className="break-all text-ink-soft">{orDash(m.email)}</Td>
                    <Td className="whitespace-nowrap text-ink-faint">
                      {formatDate(m.created_at)}
                    </Td>
                    <Td>
                      {m.unsubscribed_at ? (
                        <Badge tone="neutral">unsubscribed</Badge>
                      ) : (
                        <Badge tone="success">subscribed</Badge>
                      )}
                    </Td>
                    <Td className="text-right">
                      <ConfirmButton
                        variant="ghost"
                        size="sm"
                        title="Remove family member?"
                        message={
                          <>
                            {m.name || "This person"} will stop receiving
                            community emails from Joy. You can add them again
                            later.
                          </>
                        }
                        confirmLabel="Remove"
                        onConfirm={() => onRemove(m.id, m.name || "This person")}
                      >
                        Remove
                      </ConfirmButton>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </div>
      </div>
    </div>
  );
}
