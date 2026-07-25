"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPhotoAction, removePhotoAction } from "./actions";
import type { Photo } from "@/lib/photos";
import { Card, Input, Button, EmptyState, SectionLabel } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { useToast } from "@/components/admin/Toast";

export default function GalleryManager({ photos }: { photos: Photo[] }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
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
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setImageUrl("");
      setCaption("");
      setAlt("");
      success("Photo added to the gallery.");
      router.refresh();
    });
  }

  async function onRemove(id: string) {
    const res = await removePhotoAction(id);
    if (res && "ok" in res && !res.ok) {
      toastError("Could not remove that photo. Please try again.");
      return;
    }
    success("Photo removed from the gallery.");
    router.refresh();
  }

  return (
    <div>
      <Card>
        <SectionLabel>Add a photo</SectionLabel>
        <form onSubmit={onAdd} className="mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Choose photo"}
            </Button>
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
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="min-w-0 flex-1"
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
                <Input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Caption (optional)"
                />
                <Input
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="Describe the photo (alt text, for accessibility)"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          )}

          <div className="mt-5">
            <Button type="submit" disabled={pending || uploading}>
              {pending ? "Adding…" : "Add to gallery"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-8">
        <SectionLabel>
          In the gallery {photos.length > 0 && `(${photos.length})`}
        </SectionLabel>
        <div className="mt-3">
          {photos.length === 0 ? (
            <EmptyState
              icon="🖼️"
              title="No photos yet"
              description="Add a real photo of Joy above. It appears in the public gallery right away."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {photos.map((p) => (
                <div
                  key={p.id}
                  className="overflow-hidden rounded-xl border border-line bg-white shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image_url}
                    alt={p.image_alt || ""}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="flex items-center justify-between gap-2 p-3">
                    <p className="min-w-0 flex-1 truncate text-sm text-ink-soft">
                      {p.caption || (
                        <span className="text-ink-faint">No caption</span>
                      )}
                    </p>
                    <ConfirmButton
                      variant="ghost"
                      size="sm"
                      title="Remove photo?"
                      message="This photo will be removed from the public gallery."
                      confirmLabel="Remove"
                      onConfirm={() => onRemove(p.id)}
                    >
                      Remove
                    </ConfirmButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
