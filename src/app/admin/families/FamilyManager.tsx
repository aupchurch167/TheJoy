"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addFamilyMember,
  removeFamilyMember,
  toggleFamilyActive,
  toggleFamilySmsConsent,
  enableTextsForAll,
} from "./actions";
import type { Lead } from "@/lib/leads";
import { useToast } from "@/components/admin/Toast";
import FamilyImport from "./FamilyImport";

const LABEL = "text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint";
const FIELD =
  "w-full rounded-[9px] border border-line bg-white px-3 py-2 text-[13px] text-ink placeholder:text-ink-faint focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/25";
const FIELD_LABEL = "mb-1 block text-[11.5px] font-semibold text-ink-soft";

type Filter = "all" | "email" | "sms" | "inactive";

export default function FamilyManager({
  members,
  textableCount,
}: {
  members: Lead[];
  textableCount: number;
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [residentName, setResidentName] = useState("");
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [error, setError] = useState("");
  const [showImport, setShowImport] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [pending, start] = useTransition();
  const [enabling, startEnable] = useTransition();

  /* --- stats --- */
  const stats = useMemo(() => {
    const residents = new Set(
      members.map((m) => (m.resident_name || "").trim().toLowerCase()).filter(Boolean)
    );
    return {
      residents: residents.size,
      active: members.filter((m) => m.active).length,
      email: members.filter((m) => m.email && !m.unsubscribed_at && m.active).length,
      sms: members.filter((m) => m.sms_consent && !m.sms_opt_out_at && m.active).length,
    };
  }, [members]);

  /* --- grouping (filtered + searched) --- */
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const passFilter = (m: Lead) =>
      filter === "all"
        ? true
        : filter === "email"
          ? !!m.email && !m.unsubscribed_at && m.active
          : filter === "sms"
            ? m.sms_consent && !m.sms_opt_out_at && m.active
            : !m.active;

    const byResident = new Map<string, Lead[]>();
    for (const m of members) {
      const key = (m.resident_name || "").trim() || "No resident listed";
      if (!passFilter(m)) continue;
      if (q && !key.toLowerCase().includes(q) && !(m.name || "").toLowerCase().includes(q))
        continue;
      const arr = byResident.get(key) ?? [];
      arr.push(m);
      byResident.set(key, arr);
    }
    return [...byResident.entries()]
      .sort((a, b) => {
        if (a[0] === "No resident listed") return 1;
        if (b[0] === "No resident listed") return -1;
        return a[0].localeCompare(b[0]);
      })
      .map(([resident, contacts]) => ({ resident, contacts }));
  }, [members, search, filter]);

  /* --- handlers --- */
  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await addFamilyMember({ name, residentName, relation, phone, email, optIn, smsOptIn });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setName(""); setResidentName(""); setRelation(""); setPhone(""); setEmail("");
      setOptIn(false); setSmsOptIn(false); setShowAdd(false);
      success(`${name.trim() || "Contact"} added.`);
      router.refresh();
    });
  }

  function onEnableAllTexts() {
    if (
      !window.confirm(
        `Turn on texts for ${textableCount} family contact${textableCount === 1 ? "" : "s"} with a phone on file? ` +
          `Only do this for families who agreed to texts. Each text includes a "Reply STOP to opt out" line.`
      )
    )
      return;
    startEnable(async () => {
      const res = await enableTextsForAll();
      if (!res.ok) {
        toastError(res.error);
        return;
      }
      success(res.enabled > 0 ? `Texts turned on for ${res.enabled}.` : "No contacts needed enabling.");
      router.refresh();
    });
  }

  async function onToggleActive(m: Lead) {
    setOpenMenu(null);
    const res = await toggleFamilyActive(m.id, !m.active);
    if (!res?.ok) return toastError("Could not update. Please try again.");
    success(`${m.resident_name || m.name} marked ${!m.active ? "active" : "inactive"}.`);
    router.refresh();
  }

  async function onToggleSms(m: Lead) {
    setOpenMenu(null);
    const res = await toggleFamilySmsConsent(m.id, !m.sms_consent);
    if (!res?.ok) return toastError("Could not update. Please try again.");
    success(`Texts turned ${!m.sms_consent ? "on" : "off"} for ${m.name}.`);
    router.refresh();
  }

  async function onRemove(id: string, who: string) {
    setOpenMenu(null);
    const res = await removeFamilyMember(id);
    if (res && "ok" in res && !res.ok) return toastError("Could not remove that contact.");
    success(`${who} removed.`);
    router.refresh();
  }

  const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: "Everyone" },
    { id: "email", label: "Gets emails" },
    { id: "sms", label: "Gets texts" },
    { id: "inactive", label: "Inactive" },
  ];

  return (
    <div className="mx-auto max-w-[960px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold text-ink">Family list</h1>
          <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-ink-soft">
            Your residents&apos; families, grouped by resident. Community emails and texts
            reach only active families who opted in.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="flex-none rounded-[10px] bg-clay px-4 py-2.5 text-sm font-bold text-white shadow-[0_2px_6px_rgba(1,167,206,0.35)] hover:opacity-95"
        >
          ＋ Add a contact
        </button>
      </div>

      {/* Guardrail */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-gold/30 bg-gold/[0.08] px-4 py-2.5 text-[12.5px] leading-relaxed text-[#8a6217]">
        <span aria-hidden>⚠️</span>
        <p>
          <strong className="text-ink">Community-wide only.</strong> Emails and texts to
          this list are for everyone (parties, a monthly note, photos). Anything about one
          resident&apos;s health or an emergency stays a phone call.
        </p>
      </div>

      {/* Stat tiles */}
      <div className="my-4 flex flex-wrap gap-2.5">
        <StatTile value={stats.residents} label="residents" />
        <StatTile value={stats.active} label="active contacts" color="#1c7f27" />
        <StatTile value={stats.email} label="get emails" color="#017391" />
        <div className="flex min-w-[150px] flex-1 items-center justify-between gap-2 rounded-xl border border-line bg-white px-4 py-3">
          <div>
            <div className="text-xl font-bold text-ink">{stats.sms}</div>
            <div className="text-[11.5px] text-ink-faint">get texts</div>
          </div>
          {textableCount > 0 && (
            <button
              type="button"
              onClick={onEnableAllTexts}
              disabled={enabling}
              className="whitespace-nowrap rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-semibold text-clay-dark hover:bg-surface disabled:opacity-60"
            >
              {enabling ? "…" : `Turn on for ${textableCount} more`}
            </button>
          )}
        </div>
      </div>

      {/* Add panel */}
      {showAdd && (
        <form
          onSubmit={onAdd}
          className="mb-4 rounded-2xl border-[1.5px] border-clay bg-white p-5 shadow-[0_0_0_3px_rgba(1,167,206,0.1)]"
        >
          <div className={`${LABEL} mb-3`}>Add a family contact</div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <label>
              <span className={FIELD_LABEL}>Resident they visit</span>
              <input className={FIELD} value={residentName} onChange={(e) => setResidentName(e.target.value)} placeholder="Evelyn James" />
            </label>
            <label>
              <span className={FIELD_LABEL}>Contact name</span>
              <input className={FIELD} value={name} onChange={(e) => setName(e.target.value)} placeholder="Mike James" />
            </label>
            <label>
              <span className={FIELD_LABEL}>Relation</span>
              <input className={FIELD} value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Son" />
            </label>
            <label>
              <span className={FIELD_LABEL}>Phone</span>
              <input className={FIELD} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(404) 555-0100" />
            </label>
            <label className="sm:col-span-2">
              <span className={FIELD_LABEL}>
                Email <span className="font-normal text-ink-faint">— only needed for community emails</span>
              </span>
              <input className={FIELD} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mike@example.com" />
            </label>
          </div>

          <div className="mt-3 flex flex-col gap-2 text-[12.5px] leading-relaxed text-ink-soft">
            {email.trim() && (
              <label className="flex items-start gap-2.5">
                <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-0.5 h-[15px] w-[15px] accent-clay" />
                They agreed to community emails (invitations, monthly note, photos). Unsubscribe anytime.
              </label>
            )}
            {phone.trim() && (
              <label className="flex items-start gap-2.5">
                <input type="checkbox" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} className="mt-0.5 h-[15px] w-[15px] accent-clay" />
                They agreed to text updates. Reply STOP anytime. (Feedback survey texts do not need this.)
              </label>
            )}
          </div>

          {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}

          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            <button type="submit" disabled={pending} className="rounded-[9px] bg-clay px-4 py-2 text-[13px] font-bold text-white hover:opacity-95 disabled:opacity-60">
              {pending ? "Adding…" : "Add contact"}
            </button>
            <button type="button" onClick={() => setShowImport((v) => !v)} className="rounded-[9px] border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-soft hover:bg-surface">
              Import a list…
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="text-[13px] font-semibold text-ink-soft hover:underline">
              Cancel
            </button>
          </div>
          {showImport && (
            <div className="mt-4 border-t border-line pt-4">
              <FamilyImport />
            </div>
          )}
        </form>
      )}

      {/* Toolbar */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search residents or contacts…"
          className="min-w-[220px] flex-1 rounded-[10px] border border-line bg-white px-3.5 py-2 text-[13px] text-ink placeholder:text-ink-faint focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/25"
        />
        <div className="flex gap-1.5">
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-soft hover:bg-paper"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Groups */}
      {members.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white px-6 py-10 text-center shadow-sm">
          <div className="text-3xl">👪</div>
          <p className="mt-2 font-semibold text-ink">No family contacts yet</p>
          <p className="mt-1 text-sm text-ink-soft">
            Add a resident&apos;s family contact above, or import your existing list.
          </p>
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white px-6 py-8 text-center text-sm text-ink-faint shadow-sm">
          No one matches. Try a different search or filter.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((g) => (
            <div key={g.resident} className="overflow-visible rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(7,20,23,0.04)]">
              <div className="flex items-center gap-3 border-b border-line bg-paper px-[18px] py-3">
                <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-clay-dark font-display text-sm font-semibold text-white">
                  {initials(g.resident)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-ink">{g.resident}</div>
                  <div className="text-[11.5px] text-ink-faint">
                    {g.contacts.length} family contact{g.contacts.length === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
              {g.contacts.map((m) => (
                <ContactRow
                  key={m.id}
                  m={m}
                  menuOpen={openMenu === m.id}
                  onOpenMenu={() => setOpenMenu(openMenu === m.id ? null : m.id)}
                  onCloseMenu={() => setOpenMenu(null)}
                  onToggleActive={() => onToggleActive(m)}
                  onToggleSms={() => onToggleSms(m)}
                  onRemove={() => onRemove(m.id, m.name || "Contact")}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StatTile({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div className="min-w-[130px] flex-1 rounded-xl border border-line bg-white px-4 py-3">
      <div className="text-xl font-bold" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="text-[11.5px] text-ink-faint">{label}</div>
    </div>
  );
}

function ContactRow({
  m,
  menuOpen,
  onOpenMenu,
  onCloseMenu,
  onToggleActive,
  onToggleSms,
  onRemove,
}: {
  m: Lead;
  menuOpen: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  onToggleActive: () => void;
  onToggleSms: () => void;
  onRemove: () => void;
}) {
  const badge2 = m.unsubscribed_at
    ? { label: "Unsubscribed", bg: "rgba(207,70,54,.1)", col: "#cf4636" }
    : m.sms_consent && !m.sms_opt_out_at
      ? { label: "Texts: on", bg: "rgba(1,167,206,.12)", col: "#017391" }
      : null;

  return (
    <div
      className="grid grid-cols-[1.3fr_1fr_1.2fr_auto] items-center gap-3 border-b border-line px-[18px] py-2.5 last:border-b-0 hover:bg-paper"
      style={{ opacity: m.active ? 1 : 0.55 }}
    >
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-ink">{m.name || "—"}</div>
        {m.relation && <div className="text-[11.5px] text-ink-faint">{m.relation}</div>}
      </div>
      <div className="whitespace-nowrap text-[12.5px] text-ink-soft">{m.phone || "—"}</div>
      <div
        className="min-w-0 truncate text-[12.5px]"
        style={{
          color: m.unsubscribed_at ? "#97a0a3" : m.email ? "#626d70" : "#c6cdd0",
          textDecoration: m.unsubscribed_at ? "line-through" : "none",
        }}
      >
        {m.email || "—"}
      </div>
      <div className="relative flex items-center justify-end gap-1.5">
        <span
          className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
          style={
            m.active
              ? { background: "rgba(36,163,50,.12)", color: "#1c7f27" }
              : { background: "#eef2f3", color: "#626d70" }
          }
        >
          {m.active ? "Active" : "Inactive"}
        </span>
        {badge2 && (
          <span
            className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
            style={{ background: badge2.bg, color: badge2.col }}
          >
            {badge2.label}
          </span>
        )}
        <button
          type="button"
          onClick={onOpenMenu}
          className="rounded px-1.5 py-0.5 text-base text-ink-faint hover:text-ink"
          aria-label="More"
        >
          ⋯
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={onCloseMenu} />
            <div className="absolute right-0 top-7 z-40 flex min-w-[170px] flex-col rounded-xl border border-line bg-white p-1.5 shadow-[0_10px_30px_rgba(7,20,23,0.15)]">
              {m.phone && !m.sms_opt_out_at && (
                <button type="button" onClick={onToggleSms} className="rounded-lg px-3 py-2 text-left text-[13px] text-ink hover:bg-paper">
                  {m.sms_consent ? "Turn texts off" : "Turn texts on"}
                </button>
              )}
              <button type="button" onClick={onToggleActive} className="rounded-lg px-3 py-2 text-left text-[13px] text-ink hover:bg-paper">
                {m.active ? "Mark inactive" : "Mark active"}
              </button>
              <button type="button" onClick={onRemove} className="rounded-lg px-3 py-2 text-left text-[13px] text-danger hover:bg-danger/[0.06]">
                Remove…
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
