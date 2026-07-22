"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";
import { savePost, removePost } from "./actions";
import type { Post } from "@/lib/posts";

type Fields = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  hero_image: string;
  hero_image_alt: string;
  category: string;
  meta_title: string;
  meta_description: string;
};

function fromPost(p?: Post | null): Fields {
  return {
    id: p?.id,
    title: p?.title ?? "",
    slug: p?.slug ?? "",
    excerpt: p?.excerpt ?? "",
    body: p?.body ?? "",
    hero_image: p?.hero_image ?? "",
    hero_image_alt: p?.hero_image_alt ?? "",
    category: p?.category ?? "",
    meta_title: p?.meta_title ?? "",
    meta_description: p?.meta_description ?? "",
  };
}

export default function PostEditor({
  post,
  aiStart = false,
}: {
  post?: Post | null;
  aiStart?: boolean;
}) {
  const router = useRouter();
  const [f, setF] = useState<Fields>(fromPost(post));
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [schedule, setSchedule] = useState("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const isPublished = post?.status === "published";
  const isScheduled = post?.status === "scheduled";

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  function save(status: "draft" | "scheduled" | "published") {
    setError("");
    setMessage("");
    if (status === "scheduled" && !schedule) {
      setError("Pick a date and time to schedule.");
      return;
    }
    startTransition(async () => {
      const res = await savePost({
        ...f,
        status,
        scheduled_at: status === "scheduled" ? schedule : undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMessage(
        status === "published"
          ? "Published."
          : status === "scheduled"
            ? "Scheduled. It goes live automatically at that time."
            : "Saved as draft."
      );
      if (!f.id) {
        router.replace(`/admin/posts/${res.id}`);
      } else {
        router.refresh();
      }
    });
  }

  function onDelete() {
    if (!f.id) return;
    if (!confirm("Delete this post? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await removePost(f.id!);
      if (res.ok) router.push("/admin");
      else setError("Could not delete.");
    });
  }

  // Insert markdown around the current textarea selection.
  function wrap(before: string, after = before, placeholder = "") {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = f.body.slice(start, end) || placeholder;
    const next =
      f.body.slice(0, start) + before + selected + after + f.body.slice(end);
    set("body", next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
    });
  }

  function insertAtLineStart(prefix: string) {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = f.body.lastIndexOf("\n", start - 1) + 1;
    const next = f.body.slice(0, lineStart) + prefix + f.body.slice(lineStart);
    set("body", next);
    requestAnimationFrame(() => ta.focus());
  }

  async function uploadInline(file: File, forHero: boolean) {
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json.error || "Upload failed.");
      return;
    }
    if (forHero) {
      set("hero_image", json.url);
    } else {
      set("body", `${f.body}\n\n![](${json.url})\n`);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {f.id ? "Edit post" : "New post"}
        </h1>
        <div className="flex items-center gap-2 text-sm">
          {isPublished && (
            <a
              href={`/blog/${f.slug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-line px-3 py-1.5 text-ink-soft hover:bg-paper"
            >
              View live
            </a>
          )}
          {f.id && (
            <button
              onClick={onDelete}
              disabled={pending}
              className="rounded-full border border-line px-3 py-1.5 text-clay-dark hover:bg-clay/5"
            >
              Delete
            </button>
          )}
          <button
            onClick={() => save("draft")}
            disabled={pending}
            className="rounded-full border border-clay px-4 py-1.5 font-semibold text-clay hover:bg-clay/5 disabled:opacity-60"
          >
            Save draft
          </button>
          <button
            onClick={() => save("published")}
            disabled={pending}
            className="rounded-full bg-clay px-4 py-1.5 font-semibold text-white hover:bg-clay-dark disabled:opacity-60"
          >
            {isPublished ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {/* Scheduling */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm">
        <span className="font-medium text-ink-soft">
          {isScheduled ? "Scheduled to publish:" : "Publish later:"}
        </span>
        <input
          type="datetime-local"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-ink outline-none focus:border-clay"
        />
        <button
          onClick={() => save("scheduled")}
          disabled={pending}
          className="rounded-full border border-clay px-3 py-1.5 font-semibold text-clay hover:bg-clay/5 disabled:opacity-60"
        >
          Schedule
        </button>
        {isScheduled && post?.published_at && (
          <span className="text-ink-faint">
            (currently {new Date(post.published_at).toLocaleString()})
          </span>
        )}
      </div>

      {(message || error) && (
        <p
          role="status"
          className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${
            error ? "bg-clay/10 text-clay-dark" : "bg-sage/15 text-sage"
          }`}
        >
          {error || message}
        </p>
      )}

      <AiDraftPanel
        defaultOpen={aiStart && !post}
        onDraft={(d) => {
          setF((prev) => ({
            ...prev,
            title: d.title || prev.title,
            excerpt: d.excerpt || prev.excerpt,
            body: d.body || prev.body,
            category: d.category || prev.category,
            meta_description: d.meta_description || prev.meta_description,
          }));
          setMessage("Draft inserted. Review and edit before publishing.");
        }}
        onError={setError}
      />

      <div className="grid gap-5">
        <Field label="Title">
          <input
            value={f.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-4 py-3 text-xl font-display text-ink outline-none focus:border-clay"
            placeholder="What families are really asking"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="URL slug"
            hint="Leave blank to build it from the title."
          >
            <input
              value={f.slug}
              onChange={(e) => set("slug", e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-ink outline-none focus:border-clay"
              placeholder="auto from title"
            />
          </Field>
          <Field label="Category">
            <input
              value={f.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-ink outline-none focus:border-clay"
              placeholder="e.g. Choosing care"
            />
          </Field>
        </div>

        <Field label="Excerpt" hint="One or two sentences. Shows on cards and previews.">
          <textarea
            value={f.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-ink outline-none focus:border-clay"
          />
        </Field>

        {/* Hero image */}
        <Field label="Hero image">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={f.hero_image}
              onChange={(e) => set("hero_image", e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-line bg-white px-4 py-2.5 text-ink outline-none focus:border-clay"
              placeholder="Paste an image URL or upload"
            />
            <UploadButton label="Upload" onFile={(file) => uploadInline(file, true)} />
          </div>
          {f.hero_image && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.hero_image}
                alt=""
                className="max-h-40 rounded-lg ring-1 ring-line"
              />
              <input
                value={f.hero_image_alt}
                onChange={(e) => set("hero_image_alt", e.target.value)}
                className="mt-2 w-full rounded-lg border border-line bg-white px-4 py-2 text-sm text-ink outline-none focus:border-clay"
                placeholder="Describe the photo (alt text, for accessibility + SEO)"
              />
            </div>
          )}
        </Field>

        {/* Body editor */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-ink-soft">Body</label>
            <div className="flex rounded-lg border border-line text-sm">
              <button
                onClick={() => setTab("write")}
                className={`rounded-l-lg px-3 py-1 ${tab === "write" ? "bg-clay text-white" : "text-ink-soft"}`}
              >
                Write
              </button>
              <button
                onClick={() => setTab("preview")}
                className={`rounded-r-lg px-3 py-1 ${tab === "preview" ? "bg-clay text-white" : "text-ink-soft"}`}
              >
                Preview
              </button>
            </div>
          </div>

          {tab === "write" ? (
            <>
              <div className="mb-2 flex flex-wrap gap-1.5 text-sm">
                <ToolbarBtn onClick={() => insertAtLineStart("## ")}>H2</ToolbarBtn>
                <ToolbarBtn onClick={() => insertAtLineStart("### ")}>H3</ToolbarBtn>
                <ToolbarBtn onClick={() => wrap("**", "**", "bold")}>Bold</ToolbarBtn>
                <ToolbarBtn onClick={() => wrap("*", "*", "italic")}>Italic</ToolbarBtn>
                <ToolbarBtn onClick={() => insertAtLineStart("> ")}>Quote</ToolbarBtn>
                <ToolbarBtn onClick={() => insertAtLineStart("- ")}>List</ToolbarBtn>
                <ToolbarBtn onClick={() => wrap("[", "](https://)", "link text")}>Link</ToolbarBtn>
                <UploadButton
                  label="Image"
                  small
                  onFile={(file) => uploadInline(file, false)}
                />
              </div>
              <textarea
                ref={bodyRef}
                value={f.body}
                onChange={(e) => set("body", e.target.value)}
                rows={20}
                className="w-full rounded-lg border border-line bg-white px-4 py-3 font-mono text-sm leading-relaxed text-ink outline-none focus:border-clay"
                placeholder="Write in Markdown. Short sentences. No em-dashes. Name Mellissa where care is discussed. Joy is a personal care home (never 'assisted living')."
              />
            </>
          ) : (
            <div className="min-h-[20rem] rounded-lg border border-line bg-white px-6 py-6">
              {f.body.trim() ? (
                <Markdown>{f.body}</Markdown>
              ) : (
                <p className="text-ink-faint">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>

        {/* SEO */}
        <details className="rounded-lg border border-line bg-white px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-ink-soft">
            SEO settings (optional)
          </summary>
          <div className="mt-4 grid gap-4">
            <Field label="Meta title" hint="Defaults to the post title.">
              <input
                value={f.meta_title}
                onChange={(e) => set("meta_title", e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-ink outline-none focus:border-clay"
              />
            </Field>
            <Field label="Meta description" hint="Defaults to the excerpt.">
              <textarea
                value={f.meta_description}
                onChange={(e) => set("meta_description", e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-ink outline-none focus:border-clay"
              />
            </Field>
          </div>
        </details>
      </div>
    </div>
  );
}

/* ---------- small helpers ---------- */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      {hint && <span className="ml-2 text-xs text-ink-faint">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function ToolbarBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-line bg-paper px-2.5 py-1 font-medium text-ink-soft hover:bg-white"
    >
      {children}
    </button>
  );
}

function UploadButton({
  label,
  onFile,
  small,
}: {
  label: string;
  onFile: (file: File) => void;
  small?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className={`rounded border border-line bg-paper font-medium text-ink-soft hover:bg-white disabled:opacity-60 ${
          small ? "px-2.5 py-1 text-sm" : "px-4 py-2.5"
        }`}
      >
        {busy ? "Uploading..." : label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          await onFile(file);
          setBusy(false);
          e.target.value = "";
        }}
      />
    </>
  );
}

/* ---------- AI drafting panel (calls the Anthropic-backed endpoint) ---------- */

function AiDraftPanel({
  onDraft,
  onError,
  defaultOpen = false,
}: {
  onDraft: (d: {
    title?: string;
    excerpt?: string;
    body?: string;
    category?: string;
    meta_description?: string;
  }) => void;
  onError: (msg: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [topic, setTopic] = useState("");
  const [angle, setAngle] = useState("");
  const [busy, setBusy] = useState(false);

  async function draft() {
    if (!topic.trim()) {
      onError("Give the AI a topic first.");
      return;
    }
    setBusy(true);
    onError("");
    try {
      const res = await fetch("/api/admin/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, angle }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        onError(json.error || "The AI draft failed.");
        return;
      }
      onDraft(json.draft);
    } catch {
      onError("Could not reach the AI service.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-sage/30 bg-sage/5 p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm font-semibold text-sage"
      >
        <span aria-hidden="true">✨</span>
        {open ? "Write with AI (hide)" : "Write this post with AI"}
      </button>
      {open && (
        <div className="mt-3 grid gap-3">
          <p className="text-xs text-ink-faint">
            Give the AI a topic and it writes the whole post (title, body,
            excerpt, category, SEO) in Joy&apos;s voice and within the compliance
            rules (personal care home, never &ldquo;assisted living&rdquo; as
            Joy&apos;s label). It fills the fields below for you to review.
            Nothing publishes on its own. Always read and edit before publishing.
          </p>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic (e.g. signs a parent needs memory care)"
            className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-ink outline-none focus:border-clay"
          />
          <input
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            placeholder="Angle (optional, e.g. for a daughter researching near Loganville)"
            className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-ink outline-none focus:border-clay"
          />
          <div>
            <button
              type="button"
              onClick={draft}
              disabled={busy}
              className="rounded-full bg-sage px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Writing..." : "Write a draft"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
