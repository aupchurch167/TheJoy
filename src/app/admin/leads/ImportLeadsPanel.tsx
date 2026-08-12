"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importLeads, type ImportLeadsResult } from "./actions";
import { useToast } from "@/components/admin/Toast";
import {
  inspectLeadsCsv,
  type LeadColumnMap,
  type LeadFieldKey,
} from "@/lib/leads-import";

/**
 * Upload a CSV of old (pre-website) leads. Flow: pick a file, map its columns
 * to fields (auto-guessed, correctable), preview new-vs-existing counts, then
 * import. Mirrors scripts/import-leads.mjs: source "import[:channel]", drip
 * skipped, consent on unless held, dedupe by email.
 */

const FIELDS: { key: LeadFieldKey; label: string; required?: boolean }[] = [
  { key: "email", label: "Email", required: true },
  { key: "name", label: "Full name" },
  { key: "first", label: "First name" },
  { key: "last", label: "Last name" },
  { key: "phone", label: "Phone" },
  { key: "resident", label: "Resident name" },
  { key: "source", label: "Source / channel" },
  { key: "date", label: "Original date" },
  { key: "message", label: "Notes" },
];

export default function ImportLeadsPanel() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [sample, setSample] = useState<string[][]>([]);
  const [map, setMap] = useState<LeadColumnMap>({});
  const [source, setSource] = useState("import");
  const [hold, setHold] = useState(false);
  const [preview, setPreview] = useState<Extract<ImportLeadsResult, { ok: true }> | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function reset() {
    setCsv("");
    setFileName("");
    setHeaders([]);
    setSample([]);
    setMap({});
    setPreview(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(null);
    setError("");
    if (!file) {
      reset();
      return;
    }
    setFileName(file.name);
    const text = await file.text();
    setCsv(text);
    const info = inspectLeadsCsv(text);
    setHeaders(info.headers);
    setSample(info.rows.slice(0, 3));
    setMap(info.guess);
  }

  function setField(key: LeadFieldKey, value: string) {
    setPreview(null);
    setMap((m) => {
      const next = { ...m };
      if (value === "") delete next[key];
      else next[key] = Number(value);
      return next;
    });
  }

  function run(commit: boolean) {
    if (!csv.trim()) {
      setError("Choose a CSV file first.");
      return;
    }
    if (map.email === undefined) {
      setError("Map the Email column before continuing.");
      return;
    }
    setError("");
    start(async () => {
      const res = await importLeads({ csv, source, hold, commit, map });
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

  const emailMapped = map.email !== undefined;

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
            reached by broadcasts. Any CSV works: pick the file, then match your
            columns below. Duplicates (by email) are skipped.
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

          {/* Column mapping */}
          {headers.length > 0 && (
            <div className="rounded-lg border border-line p-3">
              <p className="mb-3 text-sm font-medium text-ink">
                Match your columns{" "}
                <span className="font-normal text-ink-faint">
                  (we guessed from the headers)
                </span>
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {FIELDS.map((f) => (
                  <label key={f.key} className="block">
                    <span className="text-xs font-medium text-ink-soft">
                      {f.label}
                      {f.required && <span className="ml-0.5 text-danger">*</span>}
                    </span>
                    <select
                      value={map[f.key] ?? ""}
                      onChange={(e) => setField(f.key, e.target.value)}
                      className={`mt-1 h-10 w-full rounded-lg border bg-white px-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/30 ${
                        f.required && !emailMapped
                          ? "border-danger"
                          : "border-line focus:border-clay"
                      }`}
                    >
                      <option value="">— not set —</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>
                          {h || `Column ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                Only Email is required. A missing name falls back to the email.
                First/Last are combined when there is no full-name column.
              </p>
            </div>
          )}

          {/* Preview of the first rows so columns are easy to eyeball */}
          {sample.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full min-w-[32rem] text-xs">
                <thead>
                  <tr className="border-b border-line bg-surface">
                    {headers.map((h, i) => (
                      <th
                        key={i}
                        className="whitespace-nowrap px-2 py-1.5 text-left font-semibold text-ink-soft"
                      >
                        {h || `Column ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sample.map((row, ri) => (
                    <tr key={ri}>
                      {headers.map((_, ci) => (
                        <td
                          key={ci}
                          className="max-w-[12rem] truncate px-2 py-1.5 text-ink-faint"
                        >
                          {row[ci] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
              disabled={pending || !csv.trim() || !emailMapped}
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
