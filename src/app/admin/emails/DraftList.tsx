"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import { Badge } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { removeBroadcast } from "./actions";

export type DraftRow = {
  id: string;
  subject: string;
  audience: "leads" | "families";
};

export default function DraftList({ drafts }: { drafts: DraftRow[] }) {
  const router = useRouter();
  const toast = useToast();

  async function del(id: string) {
    const res = await removeBroadcast(id);
    if (res.ok) {
      toast.success("Draft deleted.");
      router.refresh();
    } else {
      toast.error("Could not delete it.");
    }
  }

  return (
    <ul className="mt-2.5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-sm">
      {drafts.map((b) => (
        <li key={b.id} className="flex items-center gap-2 pr-3 hover:bg-surface">
          <Link
            href={`/admin/emails/${b.id}`}
            className="flex min-h-14 flex-1 items-center justify-between gap-4 px-5 py-3.5"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium text-ink">
                {b.subject || "(no subject)"}
              </span>
              <span className="mt-0.5 block text-sm text-ink-faint">
                {b.audience === "families" ? "Families" : "Leads"} · Draft
              </span>
            </span>
            <Badge tone="neutral">draft</Badge>
          </Link>
          <ConfirmButton
            variant="ghost"
            size="sm"
            title="Delete this draft?"
            message="This draft is deleted permanently. This cannot be undone."
            confirmLabel="Delete"
            onConfirm={() => del(b.id)}
          >
            Delete
          </ConfirmButton>
        </li>
      ))}
    </ul>
  );
}
