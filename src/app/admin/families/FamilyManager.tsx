"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addFamilyMember,
  removeFamilyMember,
  toggleFamilyActive,
  toggleFamilySmsConsent,
} from "./actions";
import type { Lead } from "@/lib/leads";
import { orDash } from "@/lib/format";
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
import FamilyImport from "./FamilyImport";

export default function FamilyManager({ members }: { members: Lead[] }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [name, setName] = useState("");
  const [residentName, setResidentName] = useState("");
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const activeCount = members.filter((m) => m.active).length;

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await addFamilyMember({
        name,
        residentName,
        relation,
        phone,
        email,
        optIn,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setName("");
      setResidentName("");
      setRelation("");
      setPhone("");
      setEmail("");
      setOptIn(false);
      success(`${name.trim() || "Contact"} added.`);
      router.refresh();
    });
  }

  async function onToggleActive(m: Lead) {
    const res = await toggleFamilyActive(m.id, !m.active);
    if (!res?.ok) {
      toastError("Could not update. Please try again.");
      return;
    }
    success(
      `${m.resident_name || m.name} marked ${!m.active ? "active" : "inactive"}.`
    );
    router.refresh();
  }

  async function onToggleSms(m: Lead) {
    const res = await toggleFamilySmsConsent(m.id, !m.sms_consent);
    if (!res?.ok) {
      toastError("Could not update. Please try again.");
      return;
    }
    success(
      `Texts turned ${!m.sms_consent ? "on" : "off"} for ${m.name}.`
    );
    router.refresh();
  }

  async function onRemove(id: string, who: string) {
    const res = await removeFamilyMember(id);
    if (res && "ok" in res && !res.ok) {
      toastError("Could not remove that contact. Please try again.");
      return;
    }
    success(`${who} removed.`);
    router.refresh();
  }

  return (
    <div>
      <Card>
        <SectionLabel>Add a family contact</SectionLabel>
        <form onSubmit={onAdd} className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Resident" htmlFor="fm-resident" hint="Who they visit.">
              <Input
                id="fm-resident"
                value={residentName}
                onChange={(e) => setResidentName(e.target.value)}
                placeholder="Evelyn James"
              />
            </Field>
            <Field label="Relation" htmlFor="fm-relation">
              <Input
                id="fm-relation"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                placeholder="Daughter"
              />
            </Field>
            <Field label="Contact name" htmlFor="fm-name" required>
              <Input
                id="fm-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mike James"
              />
            </Field>
            <Field label="Phone" htmlFor="fm-phone">
              <Input
                id="fm-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(404) 555-0100"
              />
            </Field>
            <Field
              label="Email"
              htmlFor="fm-email"
              hint="Optional. Needed only to send community emails."
            >
              <Input
                id="fm-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mike@example.com"
              />
            </Field>
          </div>

          {email.trim() && (
            <label className="mt-4 flex items-start gap-2.5 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={optIn}
                onChange={(e) => setOptIn(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-clay"
              />
              <span>
                This family agreed to receive community emails from Joy
                (invitations, a monthly note, event photos). They can unsubscribe
                anytime.
              </span>
            </label>
          )}

          {error && (
            <p className="mt-3 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          )}

          <div className="mt-5">
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add contact"}
            </Button>
          </div>
        </form>
      </Card>

      <FamilyImport />

      <div className="mt-8">
        <SectionLabel>
          Family contacts{" "}
          {members.length > 0 && `(${activeCount} active of ${members.length})`}
        </SectionLabel>
        <div className="mt-3">
          {members.length === 0 ? (
            <EmptyState
              icon="👪"
              title="No family contacts yet"
              description="Add a resident's family contact above, or import your existing list (see OPERATIONS.md)."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr className="border-b border-line">
                  <Th>Resident</Th>
                  <Th>Contact</Th>
                  <Th>Phone</Th>
                  <Th>Email</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {members.map((m) => (
                  <tr
                    key={m.id}
                    className={`transition-colors hover:bg-surface ${m.active ? "" : "opacity-60"}`}
                  >
                    <Td className="font-medium text-ink">
                      {orDash(m.resident_name)}
                    </Td>
                    <Td className="text-ink-soft">
                      <div className="text-ink">{orDash(m.name)}</div>
                      {m.relation && (
                        <div className="text-xs text-ink-faint">{m.relation}</div>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-ink-soft">
                      {orDash(m.phone)}
                    </Td>
                    <Td className="break-all text-ink-soft">
                      {m.email ? (
                        m.unsubscribed_at ? (
                          <span className="text-ink-faint line-through">
                            {m.email}
                          </span>
                        ) : (
                          m.email
                        )
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>
                      <div className="flex flex-col items-start gap-1">
                        {m.active ? (
                          <Badge tone="success">Active</Badge>
                        ) : (
                          <Badge tone="neutral">Inactive</Badge>
                        )}
                        {m.sms_opt_out_at ? (
                          <Badge tone="danger">Texts: opted out</Badge>
                        ) : m.sms_consent ? (
                          <Badge tone="info">Texts: on</Badge>
                        ) : null}
                      </div>
                    </Td>
                    <Td className="text-right">
                      <div className="inline-flex items-center gap-1">
                        {m.phone && !m.sms_opt_out_at && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleSms(m)}
                          >
                            {m.sms_consent ? "Texts off" : "Texts on"}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleActive(m)}
                        >
                          {m.active ? "Mark inactive" : "Mark active"}
                        </Button>
                        <ConfirmButton
                          variant="ghost"
                          size="sm"
                          title="Remove contact?"
                          message={
                            <>
                              {m.name || "This contact"} will be removed from the
                              family list.
                            </>
                          }
                          confirmLabel="Remove"
                          onConfirm={() => onRemove(m.id, m.name || "Contact")}
                        >
                          Remove
                        </ConfirmButton>
                      </div>
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
