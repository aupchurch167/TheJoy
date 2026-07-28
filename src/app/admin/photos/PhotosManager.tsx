"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSitePhoto } from "./actions";
import { Card, Input, Button, SectionLabel } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";

type Slot = {
  key: string;
  settingKey: string;
  label: string;
  hint: string;
  alt: string;
  aspect: string;
  defaultSrc: string;
  current: string;
};

export default function PhotosManager({
  slots,
  canUpload,
}: {
  slots: Slot[];
  canUpload: boolean;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {slots.map((slot) => (
        <PhotoSlotCard key={slot.key} slot={slot} canUpload={canUpload} />
      ))}
    </div>
  );
}

function PhotoSlotCard({ slot, canUpload }: { slot: Slot; canUpload: boolean }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  // The value shown/edited: the override if set, else the default path.
  const [value, setValue] = useState(slot.current || slot.defaultSrc);
  const [uploading, setUploading] = useState(false);
  const [broken, setBroken] = useState(false);
  const [pending, start] = useTransition();

  const usingDefault = !slot.current;

  async function onUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toastError(json.error || "Upload failed.");
        return;
      }
      setValue(json.url);
      setBroken(false);
      save(json.url);
      // The file saved, but its public URL is not readable (storage config).
      if (json.warning) toastError(json.warning);
    } catch {
      toastError("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function save(url: string) {
    start(async () => {
      const res = await saveSitePhoto(slot.settingKey, url);
      if (!res.ok) {
        toastError(res.error);
        return;
      }
      success(`${slot.label} updated.`);
      router.refresh();
    });
  }

  function reset() {
    setValue(slot.defaultSrc);
    setBroken(false);
    save("");
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionLabel>{slot.label}</SectionLabel>
        {usingDefault ? (
          <span className="text-xs text-ink-faint">using placeholder</span>
        ) : (
          <button
            onClick={reset}
            disabled={pending}
            className="text-xs font-medium text-clay hover:text-clay-dark"
          >
            Reset
          </button>
        )}
      </div>

      {/* Preview */}
      <div
        className={`mt-3 overflow-hidden rounded-lg bg-surface ring-1 ring-line ${slot.aspect}`}
      >
        {value && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={slot.alt}
            className="h-full w-full object-cover"
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs leading-relaxed text-ink-faint">
            No photo yet — {slot.alt}
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-ink-faint">{slot.hint}</p>

      {/* Controls */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canUpload && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || pending}
            >
              {uploading ? "Uploading…" : "Upload"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
          </>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setBroken(false);
          }}
          placeholder="Paste an image URL (https://…)"
          className="min-w-0 flex-1"
        />
        <Button
          size="sm"
          onClick={() => save(value === slot.defaultSrc ? "" : value)}
          disabled={pending || uploading}
        >
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </Card>
  );
}
