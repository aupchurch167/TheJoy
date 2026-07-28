"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";
import { savePost, removePost } from "./actions";
import type { Post } from "@/lib/posts";
import { suggestHeroPrompt, defaultHeroAlt } from "@/lib/hero-prompt";
import { btn, BackLink, Badge } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { useToast } from "@/components/admin/Toast";
import { formatDateTime } from "@/lib/format";

// Shared input styling so every field in the editor matches the UI kit.
const INPUT =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30";

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

const STATUS_TONE = {
  published: "success",
  scheduled: "warning",
  draft: "neutral",
} as const;

export default function PostEditor({
  post,
  aiStart = false,
}: {
  post?: Post | null;
  aiStart?: boolean;
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [f, setF] = useState<Fields>(fromPost(post));
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [schedule, setSchedule] = useState("");
  const [error, setError] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const status = post?.status ?? "draft";
  const isPublished = post?.status === "published";
  const isScheduled = post?.status === "scheduled";

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  function save(next: "draft" | "scheduled" | "published") {
    setError("");
    if (next === "scheduled" && !schedule) {
      setError("Pick a date and time to schedule.");
      return;
    }
    startTransition(async () => {
      const res = await savePost({
        ...f,
        status: next,
        scheduled_at: next === "scheduled" ? schedule : undefined,
      });
      if (!res.ok) {
        setError(res.error);
        toastError(res.error);
        return;
      }
      success(
        next === "published"
          ? "Post published."
          : next === "scheduled"
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

  async function onDelete() {
    if (!f.id) return;
    const res = await removePost(f.id);
    if (res.ok) {
      success("Post deleted.");
      router.push("/admin/posts");
    } else {
      toastError("Could not delete the post.");
    }
  }

  // Insert markdown around the current textarea selection.
  function wrap(before: string, after = before, placeholder = "") {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = f.body.slice(start, end) || placeholder;
    const nextText =
      f.body.slice(0, start) + before + selected + after + f.body.slice(end);
    set("body", nextText);
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
    const nextText = f.body.slice(0, lineStart) + prefix + f.body.slice(lineStart);
    set("body", nextText);
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
      toastError(json.error || "Upload failed.");
      return;
    }
    if (forHero) {
      set("hero_image", json.url);
    } else {
      set("body", `${f.body}\n\n![](${json.url})\n`);
    }
    // Saved to the bucket, but not readable at its public URL (storage config).
    if (json.warning) {
      setError(json.warning);
      toastError(json.warning);
    }
  }

  return (
    <div>
      <BackLink href="/admin/posts">All posts</BackLink>

      <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            {f.id ? "Edit post" : "New post"}
          </h1>
          {f.id && <Badge tone={STATUS_TONE[status]}>{status}</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isPublished && (
            <a
              href={`/blog/${f.slug}`}
              target="_blank"
              rel="noreferrer"
              className={btn("ghost", "sm")}
            >
              View live ↗
            </a>
          )}
          {f.id && (
            <ConfirmButton
              variant="ghost"
              size="sm"
              title="Delete this post?"
              message="This permanently removes the post. This cannot be undone."
              confirmLabel="Delete post"
              onConfirm={onDelete}
            >
              Delete
            </ConfirmButton>
          )}
          <button
            onClick={() => save("draft")}
            disabled={pending}
            className={btn("secondary", "sm")}
          >
            Save draft
          </button>
          <button
            onClick={() => save("published")}
            disabled={pending}
            className={btn("primary", "sm")}
          >
            {pending ? "Saving…" : isPublished ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {/* Scheduling */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm shadow-sm">
        <span className="font-medium text-ink-soft">
          {isScheduled ? "Scheduled to publish:" : "Publish later:"}
        </span>
        <input
          type="datetime-local"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-2 text-ink transition-colors focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30"
        />
        <button
          onClick={() => save("scheduled")}
          disabled={pending}
          className={btn("secondary", "sm")}
        >
          Schedule
        </button>
        {isScheduled && post?.published_at && (
          <span className="text-ink-faint">
            (currently {formatDateTime(post.published_at)})
          </span>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm font-medium text-danger"
        >
          {error}
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
          success("Draft inserted. Review and edit before publishing.");
        }}
        onError={(msg) => {
          setError(msg);
          toastError(msg);
        }}
      />

      <div className="grid gap-5">
        <Field label="Title">
          <input
            value={f.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-4 py-3 font-display text-xl text-ink transition-colors focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30"
            placeholder="What families are really asking"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="URL slug" hint="Leave blank to build it from the title.">
            <input
              value={f.slug}
              onChange={(e) => set("slug", e.target.value)}
              className={INPUT}
              placeholder="auto from title"
            />
          </Field>
          <Field label="Category">
            <input
              value={f.category}
              onChange={(e) => set("category", e.target.value)}
              className={INPUT}
              placeholder="e.g. Choosing care"
            />
          </Field>
        </div>

        <Field label="Excerpt" hint="One or two sentences. Shows on cards and previews.">
          <textarea
            value={f.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            rows={2}
            className={INPUT}
          />
        </Field>

        {/* Hero image */}
        <Field label="Hero image">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={f.hero_image}
              onChange={(e) => set("hero_image", e.target.value)}
              className={`${INPUT} min-w-0 flex-1`}
              placeholder="Paste an image URL or upload"
            />
            <UploadButton label="Upload" onFile={(file) => uploadInline(file, true)} />
          </div>

          <GenerateHeroPanel
            fields={{
              title: f.title,
              excerpt: f.excerpt,
              category: f.category,
              slug: f.slug,
            }}
            onImage={(url, altSuggestion) => {
              setF((prev) => ({
                ...prev,
                hero_image: url,
                hero_image_alt: prev.hero_image_alt || altSuggestion,
              }));
              success(
                "Hero image generated. Review it (and the alt text) before publishing."
              );
            }}
            onError={(msg) => {
              setError(msg);
              toastError(msg);
            }}
          />

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
                className={`${INPUT} mt-2`}
                placeholder="Describe the photo (alt text, for accessibility + SEO)"
              />
            </div>
          )}
        </Field>

        {/* Body editor */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-ink">Body</label>
            <div className="flex overflow-hidden rounded-lg border border-line text-sm">
              <button
                onClick={() => setTab("write")}
                className={`px-3 py-1.5 font-medium transition-colors ${tab === "write" ? "bg-clay text-white" : "text-ink-soft hover:bg-surface"}`}
              >
                Write
              </button>
              <button
                onClick={() => setTab("preview")}
                className={`px-3 py-1.5 font-medium transition-colors ${tab === "preview" ? "bg-clay text-white" : "text-ink-soft hover:bg-surface"}`}
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
                className="w-full rounded-lg border border-line bg-white px-4 py-3 font-mono text-sm leading-relaxed text-ink transition-colors focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30"
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
        <details className="rounded-xl border border-line bg-white px-4 py-3 shadow-sm">
          <summary className="cursor-pointer text-sm font-medium text-ink">
            SEO settings (optional)
          </summary>
          <div className="mt-4 grid gap-4">
            <Field label="Meta title" hint="Defaults to the post title.">
              <input
                value={f.meta_title}
                onChange={(e) => set("meta_title", e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label="Meta description" hint="Defaults to the excerpt.">
              <textarea
                value={f.meta_description}
                onChange={(e) => set("meta_description", e.target.value)}
                rows={2}
                className={INPUT}
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
      <span className="text-sm font-medium text-ink">{label}</span>
      {hint && <span className="ml-2 text-xs text-ink-faint">{hint}</span>}
      <div className="mt-1.5">{children}</div>
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
      className="rounded-lg border border-line bg-white px-2.5 py-1.5 font-medium text-ink-soft transition-colors hover:bg-surface hover:text-ink"
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
        className={`rounded-lg border border-line bg-white font-medium text-ink-soft transition-colors hover:bg-surface hover:text-ink disabled:opacity-60 ${
          small ? "px-2.5 py-1.5 text-sm" : "px-4 py-2.5 text-sm"
        }`}
      >
        {busy ? "Uploading…" : label}
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

/* ---------- Hero image generation (calls the Gemini-backed endpoint) ---------- */

function GenerateHeroPanel({
  fields,
  onImage,
  onError,
}: {
  fields: { title: string; excerpt: string; category: string; slug: string };
  onImage: (url: string, altSuggestion: string) => void;
  onError: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  function toggle() {
    setOpen((o) => {
      const next = !o;
      // Suggest a prompt the first time the panel opens.
      if (next && !prompt.trim()) setPrompt(suggestHeroPrompt(fields));
      return next;
    });
  }

  async function generate() {
    if (!prompt.trim()) {
      onError("Write a prompt for the image first.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, slug: fields.slug || fields.title }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        onError(json.error || "Image generation failed.");
        return;
      }
      onImage(json.url, defaultHeroAlt(fields));
    } catch {
      onError("Could not reach the image service.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-sage/30 bg-sage/5 p-3">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 text-sm font-semibold text-sage"
      >
        <span aria-hidden="true">✨</span>
        {open
          ? "Generate a hero image with Gemini (hide)"
          : "Generate a hero image with Gemini"}
      </button>
      {open && (
        <div className="mt-3 grid gap-2">
          <p className="text-xs leading-relaxed text-ink-faint">
            Describe the image you want (we suggested one from your title, edit it
            freely). Gemini creates it and saves it as the hero image. These are
            AI illustrations, not real photos of Joy, so keep them atmospheric
            (light, a porch, hands, a table), never fake photos of the home,
            residents, or staff. Review before publishing.
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className={INPUT}
            placeholder="Describe the hero image you want…"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={generate}
              disabled={busy}
              className={btn("primary", "sm", "bg-sage hover:bg-sage/90")}
            >
              {busy ? "Generating…" : "Generate image"}
            </button>
            <button
              type="button"
              onClick={() => setPrompt(suggestHeroPrompt(fields))}
              disabled={busy}
              className={btn("secondary", "sm")}
            >
              Suggest a prompt
            </button>
          </div>
        </div>
      )}
    </div>
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
          <p className="text-xs leading-relaxed text-ink-faint">
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
            className={INPUT}
          />
          <input
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            placeholder="Angle (optional, e.g. for a daughter researching near Loganville)"
            className={INPUT}
          />
          <div>
            <button
              type="button"
              onClick={draft}
              disabled={busy}
              className={btn("primary", "sm", "bg-sage hover:bg-sage/90")}
            >
              {busy ? "Writing…" : "Write a draft"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
