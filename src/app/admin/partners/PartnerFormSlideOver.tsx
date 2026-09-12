"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
  type ButtonVariant,
  type ButtonSize,
} from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import SlideOver from "./SlideOver";
import { createPartner, updatePartnerAction } from "./actions";
import {
  PARTNER_CATEGORIES,
  PARTNER_STATUSES,
  PARTNER_TIERS,
  PARTNER_OWNERS,
  STATUS_LABEL,
  OWNER_LABEL,
  type PartnerTier,
} from "@/lib/partners-vocab";
import type { Partner } from "@/lib/partners";

type Props = {
  mode: "add" | "edit";
  partner?: Partner;
  triggerLabel?: string;
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
  triggerClassName?: string;
};

const LABEL_HALF = "grid gap-4 sm:grid-cols-2";

export default function PartnerFormSlideOver({
  mode,
  partner,
  triggerLabel,
  triggerVariant = mode === "add" ? "primary" : "secondary",
  triggerSize = "sm",
  triggerClassName,
}: Props) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  // Controlled fields (seed from the partner when editing).
  const [organization, setOrganization] = useState(partner?.organization ?? "");
  const [category, setCategory] = useState(partner?.category ?? "other");
  const [tier, setTier] = useState<PartnerTier | "">(partner?.tier ?? "");
  const [status, setStatus] = useState(partner?.status ?? "not_contacted");
  const [owner, setOwner] = useState(partner?.owner ?? "both");
  const [contactName, setContactName] = useState(partner?.contact_name ?? "");
  const [contactRole, setContactRole] = useState(partner?.contact_role ?? "");
  const [phone, setPhone] = useState(partner?.phone ?? "");
  const [email, setEmail] = useState(partner?.email ?? "");
  const [website, setWebsite] = useState(partner?.website ?? "");
  const [serviceArea, setServiceArea] = useState(partner?.service_area ?? "");
  const [nextAction, setNextAction] = useState(partner?.next_action ?? "");
  const [nextDate, setNextDate] = useState(partner?.next_date ?? "");
  const [notes, setNotes] = useState(partner?.notes ?? "");

  function submit() {
    if (!organization.trim()) {
      toastError("Organization is required.");
      return;
    }
    start(async () => {
      const payload = {
        organization,
        category,
        tier: tier || null,
        status,
        owner,
        contact_name: contactName,
        contact_role: contactRole,
        phone,
        email,
        website,
        service_area: serviceArea,
        next_action: nextAction,
        next_date: nextDate,
        notes,
      };
      const res =
        mode === "add"
          ? await createPartner(payload)
          : await updatePartnerAction({ ...payload, id: partner!.id });
      if (!res.ok) {
        toastError(res.error);
        return;
      }
      success(mode === "add" ? "Partner added." : "Changes saved.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        variant={triggerVariant}
        size={triggerSize}
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        {triggerLabel ?? (mode === "add" ? "Add partner" : "Edit")}
      </Button>

      <SlideOver
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "add" ? "Add partner" : organization || "Edit partner"}
        description={
          mode === "add"
            ? "A referral source to stay in touch with."
            : "Update this partner's details."
        }
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={pending}>
              {pending ? "Saving…" : "Save partner"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Organization" required htmlFor="org">
            <Input
              id="org"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. Piedmont Walton Hospital"
            />
          </Field>

          <div className={LABEL_HALF}>
            <Field label="Category" required htmlFor="category">
              <Select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {PARTNER_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tier">
              <div className="flex gap-2">
                {PARTNER_TIERS.map((t) => {
                  const on = tier === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTier(on ? "" : t)}
                      className={`h-11 flex-1 rounded-lg border text-sm font-semibold transition-colors ${
                        on
                          ? "border-clay bg-clay/10 text-clay-dark"
                          : "border-line bg-white text-ink-soft hover:bg-surface"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>

          <div className={LABEL_HALF}>
            <Field label="Status" htmlFor="status">
              <Select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                {PARTNER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Owner" htmlFor="owner">
              <Select
                id="owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value as typeof owner)}
              >
                {PARTNER_OWNERS.map((o) => (
                  <option key={o} value={o}>
                    {OWNER_LABEL[o]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="border-t border-line pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Contact
            </p>
            <div className="space-y-4">
              <div className={LABEL_HALF}>
                <Field label="Contact name">
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Dana Reyes"
                  />
                </Field>
                <Field label="Role">
                  <Input
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    placeholder="e.g. Case manager"
                  />
                </Field>
              </div>
              <div className={LABEL_HALF}>
                <Field label="Phone">
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(470) 555-0100"
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@org.com"
                  />
                </Field>
              </div>
              <div className={LABEL_HALF}>
                <Field label="Website">
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://"
                  />
                </Field>
                <Field label="Service area">
                  <Input
                    value={serviceArea}
                    onChange={(e) => setServiceArea(e.target.value)}
                    placeholder="e.g. Walton, Gwinnett"
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="border-t border-line pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Next step
            </p>
            <div className="space-y-4">
              <div className={LABEL_HALF}>
                <Field label="Next action">
                  <Input
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    placeholder="e.g. Drop off packet"
                  />
                </Field>
                <Field label="Next date">
                  <Input
                    type="date"
                    value={nextDate ? nextDate.slice(0, 10) : ""}
                    onChange={(e) => setNextDate(e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Notes">
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything worth remembering."
                />
              </Field>
            </div>
          </div>
        </div>
      </SlideOver>
    </>
  );
}
