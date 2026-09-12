"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  ButtonLink,
  Card,
  SectionLabel,
  Select,
} from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { importPartners, type ImportPartnersResult } from "./actions";
import {
  inspectPartnersCsv,
  PARTNER_IMPORT_FIELDS,
  type PartnerColumnMap,
  type PartnerFieldKey,
} from "@/lib/partners-import";

/**
 * Collapsible CSV import for partners: choose file -> map columns -> Preview
 * (server dry-run with DB dedupe) -> Import. URL-toggled via ?import=1 so the
 * header "Import CSV" button opens it; "Hide" links back.
 */
export default function ImportPartnersPanel({ open }: { open: boolean }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();

  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [sample, setSample] = useState<string[][]>([]);
  const [map, setMap] = useState<PartnerColumnMap>({});
  const [preview, setPreview] = useState<
    Extract<ImportPartnersResult, { ok: true }> | null
  >(null);
  const [error, setError] = useState("");

  if (!open) return null;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setCsv(text);
      const { headers, rows, guess } = inspectPartnersCsv(text);
      setHeaders(headers);
      setSample(rows.slice(0, 3));
      setMap(guess);
      setPreview(null);
      setError("");
    };
    reader.readAsText(file);
  }

  function setColumn(field: PartnerFieldKey, value: string) {
    setMap((m) => {
      const next = { ...m };
      if (value === "") delete next[field];
      else next[field] = Number(value);
      return next;
    });
    setPreview(null);
  }

  function reset() {
    setFileName("");
    setCsv("");
    setHeaders([]);
    setSample([]);
    setMap({});
    setPreview(null);
    setError("");
    if (fileInput.current) fileInput.current.value = "";
  }

  function run(commit: boolean) {
    if (!csv.trim()) {
      setError("Choose a CSV file first.");
      return;
    }
    if (map.organization === undefined) {
      setError("Map the Organization column before continuing.");
      return;
    }
    setError("");
    start(async () => {
      const res = await importPartners({ csv, map, commit });
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
    <Card className="mb-6">
      <div className="flex items-center justify-between">
        <SectionLabel>Import partners from CSV</SectionLabel>
        <ButtonLink href="/admin/partners" variant="ghost" size="sm">
          Hide
        </ButtonLink>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Upload a spreadsheet of referral sources. Map your columns, preview, then
        import. Only Organization and Category are required. Unknown categories
        become &ldquo;Other&rdquo; and unmapped rows default to &ldquo;Not
        contacted.&rdquo; Duplicates (by organization name) are skipped.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInput.current?.click()}
        >
          Choose CSV file
        </Button>
        <span className="text-sm text-ink-faint">
          {fileName || "No file selected"}
        </span>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onFile}
        />
      </div>

      {headers.length > 0 && (
        <>
          {/* Column mapping */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Match your columns
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PARTNER_IMPORT_FIELDS.map((f) => (
                <label key={f.key} className="block">
                  <span className="mb-1 block text-sm font-medium text-ink">
                    {f.label}
                    {f.required && <span className="ml-0.5 text-danger">*</span>}
                  </span>
                  <Select
                    value={map[f.key] ?? ""}
                    onChange={(e) => setColumn(f.key, e.target.value)}
                  >
                    <option value="">Not mapped</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </option>
                    ))}
                  </Select>
                </label>
              ))}
            </div>
          </div>

          {/* Raw preview */}
          {sample.length > 0 && (
            <div className="mt-5 overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface">
                    {headers.map((h, i) => (
                      <th
                        key={i}
                        className="whitespace-nowrap px-3 py-2 text-left font-semibold text-ink-soft"
                      >
                        {h || `Column ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sample.map((row, r) => (
                    <tr key={r}>
                      {headers.map((_, c) => (
                        <td key={c} className="px-3 py-2 text-ink-soft">
                          {row[c] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {error && (
        <p className="mt-4 text-sm font-medium text-danger">{error}</p>
      )}

      {preview && (
        <div className="mt-4 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
          <span className="font-semibold text-ink">{preview.added}</span> new
          partner{preview.added === 1 ? "" : "s"} ready to import ·{" "}
          <span className="font-semibold text-ink">{preview.alreadyInList}</span>{" "}
          already on the list
          {preview.dupeInFile > 0 && <> · {preview.dupeInFile} duplicate rows in file</>}
          {preview.noOrg > 0 && <> · {preview.noOrg} rows with no organization</>}
        </div>
      )}

      {headers.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => run(false)}
            disabled={pending || !csv.trim() || map.organization === undefined}
          >
            {pending ? "Checking…" : "Preview"}
          </Button>
          <Button
            size="sm"
            onClick={() => run(true)}
            disabled={pending || !preview || preview.added === 0}
          >
            {preview && preview.added > 0
              ? `Import ${preview.added} partner${preview.added === 1 ? "" : "s"}`
              : "Import"}
          </Button>
          <button
            type="button"
            onClick={reset}
            className="text-sm text-ink-faint hover:text-ink"
          >
            Clear
          </button>
        </div>
      )}
    </Card>
  );
}
