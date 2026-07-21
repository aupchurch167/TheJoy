"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addFamilyMember, removeFamilyMember } from "./actions";
import type { Lead } from "@/lib/leads";

export default function FamilyManager({ members }: { members: Lead[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    start(async () => {
      const res = await addFamilyMember({ name, email, optIn });
      if (!res.ok) return setError(res.error);
      setName("");
      setEmail("");
      setOptIn(false);
      setMessage("Added.");
      router.refresh();
    });
  }

  function onRemove(id: string, memberName: string) {
    if (!confirm(`Remove ${memberName} from the family list?`)) return;
    start(async () => {
      await removeFamilyMember(id);
      router.refresh();
    });
  }

  return (
    <div>
      <form
        onSubmit={onAdd}
        className="rounded-lg border border-line bg-white p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-ink outline-none focus:border-clay"
              placeholder="Jane Smith"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-ink outline-none focus:border-clay"
              placeholder="jane@example.com"
            />
          </label>
        </div>

        <label className="mt-4 flex items-start gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => setOptIn(e.target.checked)}
            className="mt-1"
          />
          <span>
            This family member agreed to receive community emails from Joy
            (invitations, a monthly note, event photos). They can unsubscribe
            anytime.
          </span>
        </label>

        {(error || message) && (
          <p
            className={`mt-3 text-sm ${error ? "text-clay-dark" : "text-sage"}`}
            role="alert"
          >
            {error || message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-full bg-clay px-5 py-2 text-sm font-semibold text-white hover:bg-clay-dark disabled:opacity-60"
        >
          Add family member
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-ink-faint">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-faint">
                  No family members yet.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-2 font-medium text-ink">{m.name}</td>
                  <td className="px-4 py-2 text-ink-soft">{m.email}</td>
                  <td className="px-4 py-2">
                    {m.unsubscribed_at ? (
                      <span className="rounded-full bg-line/70 px-2 py-0.5 text-xs text-ink-faint">
                        unsubscribed
                      </span>
                    ) : (
                      <span className="rounded-full bg-sage/15 px-2 py-0.5 text-xs text-sage">
                        subscribed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => onRemove(m.id, m.name)}
                      disabled={pending}
                      className="text-clay-dark hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
