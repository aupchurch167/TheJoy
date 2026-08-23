"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import { Card, Button, Input, SectionLabel, Badge } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import type { Employee } from "@/lib/employees";
import type { ConnecteamStatus } from "@/lib/connecteam-sync";
import {
  addEmployee,
  toggleEmployeeActive,
  removeEmployee,
  importEmployeesCsv,
  syncConnecteamNow,
} from "../actions";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function RosterManager({
  employees,
  connecteam,
}: {
  employees: Employee[];
  connecteam: ConnecteamStatus;
}) {
  const router = useRouter();
  const toast = useToast();
  const [syncing, setSyncing] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const [showCsv, setShowCsv] = useState(false);
  const [csv, setCsv] = useState("");
  const [importing, setImporting] = useState(false);

  const active = employees.filter((e) => e.active);
  const inactive = employees.filter((e) => !e.active);

  async function add() {
    if (!name.trim()) {
      toast.error("Add a name.");
      return;
    }
    setBusy(true);
    const res = await addEmployee({
      name,
      email,
      phone,
      title,
      smsConsent,
    });
    setBusy(false);
    if (res.ok) {
      toast.success(res.message ?? "Added.");
      setName("");
      setEmail("");
      setPhone("");
      setTitle("");
      setSmsConsent(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function syncNow() {
    setSyncing(true);
    const res = await syncConnecteamNow();
    setSyncing(false);
    if (res.ok) {
      const r = res.result;
      toast.success(
        `Synced: ${r.added} added, ${r.updated} updated${
          r.deactivated ? `, ${r.deactivated} deactivated` : ""
        }.`
      );
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function runImport() {
    if (!csv.trim()) return;
    setImporting(true);
    const res = await importEmployeesCsv(csv);
    setImporting(false);
    if (res.ok) {
      toast.success(res.message ?? "Imported.");
      setCsv("");
      setShowCsv(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  function Row({ e }: { e: Employee }) {
    return (
      <div
        className="flex flex-col gap-1.5 border-b border-line px-4 py-3 last:border-b-0 sm:grid sm:grid-cols-[1.3fr_1.4fr_auto] sm:items-center sm:gap-3"
        style={{ opacity: e.active ? 1 : 0.55 }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-semibold text-ink">{e.name}</span>
            {e.external_source === "connecteam" && (
              <span className="rounded-full bg-clay/[0.12] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-clay-dark">
                Connecteam
              </span>
            )}
          </div>
          {e.title && <div className="text-[11.5px] text-ink-faint">{e.title}</div>}
        </div>
        <div className="min-w-0 text-[12.5px] text-ink-soft">
          <div className="sm:truncate">{e.email || "—"}</div>
          {e.phone && (
            <div className="text-[11px] text-ink-faint">
              {e.phone}
              {e.sms_consent ? " · texts on" : ""}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={async () => {
              const res = await toggleEmployeeActive(e.id, !e.active);
              if (res.ok) router.refresh();
              else toast.error(res.error);
            }}
            className="rounded-md px-2 py-1 text-xs font-semibold text-ink-soft hover:bg-surface"
          >
            {e.active ? "Deactivate" : "Reactivate"}
          </button>
          <ConfirmButton
            variant="ghost"
            size="sm"
            title="Remove this person?"
            message="This deletes them from the roster. Past anonymous responses stay; named responses are unlinked."
            confirmLabel="Remove"
            onConfirm={async () => {
              const res = await removeEmployee(e.id);
              if (res.ok) {
                toast.success("Removed.");
                router.refresh();
              } else {
                toast.error(res.error);
              }
            }}
          >
            ✕
          </ConfirmButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connecteam sync */}
      {connecteam.enabled && (
        <Card className="border-clay/30 bg-clay/[0.04]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">
                  Connecteam
                </span>
                <Badge tone="success">source of truth</Badge>
              </div>
              <p className="mt-0.5 text-xs text-ink-faint">
                {connecteam.lastSyncAt
                  ? `Last synced ${timeAgo(connecteam.lastSyncAt)}. Refreshes automatically about twice a day.`
                  : "Not synced yet. Runs automatically, or pull it now."}
                {connecteam.last && !connecteam.last.ok && connecteam.last.error
                  ? ` Last attempt failed: ${connecteam.last.error}`
                  : ""}
              </p>
            </div>
            <Button size="sm" onClick={syncNow} disabled={syncing}>
              {syncing ? "Syncing…" : "Sync now"}
            </Button>
          </div>
        </Card>
      )}

      {/* Add */}
      <Card>
        <div className="flex items-center justify-between">
          <SectionLabel>Add a team member</SectionLabel>
          <button
            type="button"
            onClick={() => setShowCsv((v) => !v)}
            className="text-xs font-semibold text-clay-dark hover:underline"
          >
            {showCsv ? "Hide CSV import" : "Import a CSV"}
          </button>
        </div>

        {showCsv ? (
          <div className="mt-4">
            <p className="mb-2 text-xs text-ink-faint">
              Paste rows with a header line. Columns:{" "}
              <code className="rounded bg-surface px-1">name,email,phone,title</code>{" "}
              (name required; order doesn&apos;t matter).
            </p>
            <textarea
              className="min-h-[130px] w-full resize-y rounded-lg border border-line bg-white px-3 py-2 font-mono text-xs text-ink focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/25"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={"name,email,phone,title\nDana Lee,dana@example.com,770-555-0101,Caregiver"}
            />
            <div className="mt-2 flex justify-end">
              <Button size="sm" onClick={runImport} disabled={importing}>
                {importing ? "Importing…" : "Import"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Role (optional)"
            />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (optional)"
            />
            <label className="flex items-center gap-2 text-sm text-ink-soft sm:col-span-2">
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
                className="h-4 w-4 rounded border-line"
              />
              They agreed to receive work texts (needed to survey by SMS)
            </label>
            <div className="sm:col-span-2 sm:flex sm:justify-end">
              <Button onClick={add} disabled={busy}>
                {busy ? "Adding…" : "Add to roster"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* List */}
      <Card padded={false}>
        <div className="flex items-center justify-between px-4 py-3">
          <SectionLabel>
            Roster{" "}
            <span className="font-normal text-ink-faint">
              ({active.length} active)
            </span>
          </SectionLabel>
        </div>
        {employees.length === 0 ? (
          <p className="px-4 pb-5 text-sm text-ink-faint">
            No one on the roster yet. Add your team above.
          </p>
        ) : (
          <div className="border-t border-line">
            {active.map((e) => (
              <Row key={e.id} e={e} />
            ))}
            {inactive.length > 0 && (
              <>
                <div className="flex items-center gap-2 bg-paper px-4 py-2">
                  <Badge tone="neutral">Inactive</Badge>
                  <span className="text-xs text-ink-faint">
                    Not surveyed until reactivated
                  </span>
                </div>
                {inactive.map((e) => (
                  <Row key={e.id} e={e} />
                ))}
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
