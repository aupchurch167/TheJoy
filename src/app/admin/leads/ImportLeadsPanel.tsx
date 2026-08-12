"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importLeads, type ImportLeadsResult } from "./actions";
import { useToast } from "@/components/admin/Toast";

/**
 * Upload a CSV of old (pre-website) leads from the admin. Reads the file in the
 * browser, previews new-vs-existing counts (no writes), then imports on confirm.
 * Mirrors scripts/import-leads.mjs: source "import[:channel]", drip skipped,
 * consent on unless held for re-permission. Imports dedupe by email.
 */
export default function ImportLeadsPanel() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [source, setSource] = useState("import");
  const [hold, setHold] = useState(false);
  const [preview, setPreview] = useState<Extract<ImportLeadsResult, { ok: true }> | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function reset() {
    setCsv("");
    setFileName("");
    setPreview(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(null);
    setError("");
    if (!file) {
      setCsv("");
      setFileName("");
      return;
    }
    setFileName(file.name);
    setCsv(await file.text());
  }

  function run(commit: boolean) {
    if (!csv.trim()) {
      setError("Choose a CSV file first.");
      return;
    }
    setError("");
    start(async () => {
      const res = await importLeads({ csv, source, hold, commit });
      if (!res.ok) {
        setError(res.error);
        toastError(res.error);
        return;
      }
      if (commit) {
        success(res.message);
        reset();
        router.refresh();
      } else {
        setPreview(res);
      }
    });
  }

  return (
    <div className="mb-6 rounded-xl border border-line bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span aria-hidden>⬆️</span> Import leads from a CSV
        </span>
        <span className="text-xs text-ink-faint">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="grid gap-4 border-t border-line p-4">
          <p className="text-xs leading-relaxed text-ink-faint">
            For old leads that did not come from the website. They are tagged{" "}
            <code className="rounded bg-surface px-1">{source || "import"}</code>{" "}
            (hidden from website reports), skip the welcome drip, and can be
            reached by broadcasts. A header row and an{" "}
            <strong>email</strong> column are required; optional columns:{" "}
            name, phone, source, date, notes. Duplicates (by email) are skipped.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-soft">CSV file</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-clay/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-clay hover:file:bg-clay/20"
            />
            {fileName && (
              <span className="text-xs text-ink-faint">Selected: {fileName}</span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-ink-soft">
                Source tag
              </span>
              <input
                type="text"
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setPreview(null);
                }}
                placeholder="import"
                className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30"
              />
            </label>
            <label className="flex items-start gap-2 sm:pt-6">
              <input
                type="checkbox"
                checked={hold}
                onChange={(e) => {
                  setHold(e.target.checked);
                  setPreview(null);
                }}
                className="mt-0.5 h-5 w-5 rounded border-line text-clay focus:ring-clay/30"
              />
              <span className="text-sm text-ink-soft">
                Hold for re-permission (consent off, kept out of broadcasts)
              </span>
            </label>
          </div>

          {preview && (
            <div className="rounded-lg border border-line bg-surface p-3 text-sm text-ink-soft">
              <p>
                <strong className="text-ink">{preview.added}</strong> new lead
                {preview.added === 1 ? "" : "s"} ready to import
                {preview.alreadyInList > 0 && (
                  <> · {preview.alreadyInList} already in the list</>
                )}
              </p>
              {(preview.noEmail > 0 ||
                preview.badEmail > 0 ||
                preview.dupeInFile > 0) && (
                <p className="mt-1 text-xs text-ink-faint">
                  Skipped rows: {preview.noEmail} no email, {preview.badEmail}{" "}
                  invalid email, {preview.dupeInFile} duplicate in file.
                </p>
              )}
              {preview.failed > 0 && (
                <p className="mt-1 text-xs font-medium text-danger">
                  {preview.failed} row(s) could not be imported.
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => run(false)}
              disabled={pending || !csv.trim()}
              className="h-10 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink-soft hover:bg-surface disabled:opacity-50"
            >
              {pending ? "Checking…" : "Preview"}
            </button>
            <button
              type="button"
              onClick={() => run(true)}
              disabled={pending || !preview || preview.added === 0}
              className="h-10 rounded-lg bg-clay px-4 text-sm font-semibold text-white hover:bg-clay-dark disabled:opacity-50"
            >
              {pending
                ? "Importing…"
                : preview
                  ? `Import ${preview.added} lead${preview.added === 1 ? "" : "s"}`
                  : "Import"}
            </button>
            {(csv || preview) && (
              <button
                type="button"
                onClick={reset}
                disabled={pending}
                className="text-sm font-medium text-ink-faint underline underline-offset-2 hover:text-clay disabled:opacity-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
