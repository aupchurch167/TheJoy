"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPhotoAction, removePhotoAction } from "./actions";
import type { Photo } from "@/lib/photos";

export default function GalleryManager({ photos }: { photos: Photo[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [alt, setAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  async function onPickFile(file: File) {
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) setError(json.error || "Upload failed.");
      else setImageUrl(json.url);
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!imageUrl) {
      setError("Upload a photo or paste an image URL first.");
      return;
    }
    start(async () => {
      const res = await addPhotoAction({ imageUrl, caption, alt });
      if (!res.ok) return setError(res.error);
      setImageUrl("");
      setCaption("");
      setAlt("");
      router.refresh();
    });
  }

  function onRemove(id: string) {
    if (!confirm("Remove this photo from the gallery?")) return;
    start(async () => {
      await removePhotoAction(id);
      router.refresh();
    });
  }

  return (
    <div>
      <form onSubmit={onAdd} className="rounded-lg border border-line bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-full border border-clay px-4 py-2 text-sm font-semibold text-clay hover:bg-clay/5 disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Choose photo"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickFile(f);
              e.target.value = "";
            }}
          />
          <span className="text-sm text-ink-faint">or paste an image URL:</span>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-clay"
          />
        </div>

        {imageUrl && (
          <div className="mt-4 flex gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              className="h-24 w-24 rounded-lg object-cover ring-1 ring-line"
            />
            <div className="flex-1 space-y-2">
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption (optional)"
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-clay"
              />
              <input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Describe the photo (alt text, for accessibility)"
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-clay"
              />
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-clay-dark" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || uploading}
          className="mt-4 rounded-full bg-clay px-5 py-2 text-sm font-semibold text-white hover:bg-clay-dark disabled:opacity-60"
        >
          Add to gallery
        </button>
      </form>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {photos.length === 0 ? (
          <p className="col-span-full rounded-lg border border-line bg-white px-5 py-8 text-center text-ink-soft">
            No photos yet.
          </p>
        ) : (
          photos.map((p) => (
            <div
              key={p.id}
              className="overflow-hidden rounded-lg border border-line bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image_url}
                alt={p.image_alt || ""}
                className="aspect-square w-full object-cover"
              />
              <div className="p-3">
                {p.caption && (
                  <p className="text-sm text-ink-soft">{p.caption}</p>
                )}
                <button
                  onClick={() => onRemove(p.id)}
                  disabled={pending}
                  className="mt-2 text-xs font-medium text-clay-dark hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
