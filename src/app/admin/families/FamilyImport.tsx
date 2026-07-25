"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importFamilyContacts } from "./actions";
import { Card, Button, Textarea, SectionLabel } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";

export default function FamilyImport() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.readAsText(file);
  }

  function run() {
    start(async () => {
      const res = await importFamilyContacts(text);
      if (!res.ok) {
        toastError(res.error);
        return;
      }
      const parts = [`${res.added} added`, `${res.skipped} skipped (duplicates)`];
      if (res.invalid > 0) parts.push(`${res.invalid} could not be read`);
      success(`Import done: ${parts.join(", ")}.`);
      setText("");
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <div className="mt-4">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          Import a list
        </Button>
      </div>
    );
  }

  return (
    <Card className="mt-4">
      <div className="flex items-center justify-between">
        <SectionLabel>Import contacts</SectionLabel>
        <button
          onClick={() => setOpen(false)}
          className="text-sm text-ink-faint hover:text-ink"
        >
          Cancel
        </button>
      </div>
      <p className="mt-2 text-sm text-ink-soft">
        Paste a list or choose a file (CSV, or copied from a spreadsheet).
        Columns: <strong>resident, relation, contact name, phone, email</strong>{" "}
        (a header row is optional). Contacts already on the list are skipped, so
        you can safely re-import.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileRef.current?.click()}
        >
          Choose file
        </Button>
        <span className="text-sm text-ink-faint">or paste below</span>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.txt,text/csv,text/plain"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="mt-3 font-mono text-xs"
        placeholder={
          "resident,relation,contact name,phone,email\nEvelyn James,Daughter,Mike James,(404) 555-0100,mike@example.com"
        }
      />

      <div className="mt-4">
        <Button onClick={run} disabled={pending || text.trim() === ""}>
          {pending ? "Importing…" : "Import"}
        </Button>
      </div>
    </Card>
  );
}
