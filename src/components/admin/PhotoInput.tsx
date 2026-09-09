"use client";

import { useRef, useState } from "react";
import ImageCropper, { type AspectOption } from "./ImageCropper";
import { useToast } from "./Toast";

/**
 * Upload-and-edit a photo in one control. Picking a file (or pressing Edit on an
 * existing one) opens the editor (crop, zoom, rotate, light adjustments); on save
 * the edited image is uploaded and the URL handed back via onUrl. Use this
 * anywhere a photo is added so every upload gets the same editing.
 */
export default function PhotoInput({
  label = "Photo",
  url,
  onUrl,
  aspect = 3 / 2,
  aspectOptions,
  allowFree = true,
  transparent = false,
  filename = "photo",
}: {
  label?: string;
  url: string | null;
  onUrl: (u: string | null) => void;
  aspect?: number;
  aspectOptions?: AspectOption[];
  allowFree?: boolean;
  transparent?: boolean;
  filename?: string;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function closeEditor() {
    if (cropSrc?.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  async function uploadFile(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Upload failed.");
      onUrl(data.url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "rounded-md bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-line disabled:opacity-50";

  return (
    <div className="rounded-lg border border-line bg-paper p-2.5">
      <span className="mb-1.5 block text-[11px] font-semibold text-ink-soft">
        {label}
      </span>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="mb-2 w-full rounded-md" />
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className={btn}
        >
          {busy ? "Uploading…" : url ? "Replace" : "Upload a photo"}
        </button>
        {url && (
          <button
            type="button"
            onClick={() =>
              setCropSrc(`/api/admin/image-proxy?url=${encodeURIComponent(url)}`)
            }
            disabled={busy}
            className={btn}
          >
            ✎ Edit
          </button>
        )}
        {url && (
          <button
            type="button"
            onClick={() => onUrl(null)}
            className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-danger hover:bg-white"
          >
            Remove
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setCropSrc(URL.createObjectURL(f));
          e.target.value = "";
        }}
      />
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          aspect={aspect}
          aspectOptions={aspectOptions}
          allowFree={allowFree}
          transparent={transparent}
          filename={filename}
          onCancel={closeEditor}
          onCropped={async (file) => {
            await uploadFile(file);
            closeEditor();
          }}
        />
      )}
    </div>
  );
}
