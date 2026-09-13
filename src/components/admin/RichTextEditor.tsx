"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight inbox-style rich text editor (like an email compose box): bold,
 * italic, underline, and bullet/numbered lists. Emits HTML via onChange; store
 * it sanitized (see lib/sanitize-html). No external dependency; uses the
 * built-in contentEditable + execCommand, which is well supported across
 * browsers for these basic commands. Not Markdown.
 */

type Cmd = {
  label: string;
  command: string;
  value?: string;
  title: string;
};

const COMMANDS: Cmd[] = [
  { label: "B", command: "bold", title: "Bold (Ctrl/Cmd+B)" },
  { label: "I", command: "italic", title: "Italic (Ctrl/Cmd+I)" },
  { label: "U", command: "underline", title: "Underline (Ctrl/Cmd+U)" },
  { label: "• List", command: "insertUnorderedList", title: "Bulleted list" },
  { label: "1. List", command: "insertOrderedList", title: "Numbered list" },
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = "8rem",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Sync incoming value into the DOM only when it differs from what's already
  // rendered, so typing (which fires onChange) never resets the caret.
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value]);

  function run(cmd: Cmd) {
    ref.current?.focus();
    document.execCommand(cmd.command, false, cmd.value);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function clearFormatting() {
    ref.current?.focus();
    document.execCommand("removeFormat");
    if (ref.current) onChange(ref.current.innerHTML);
  }

  return (
    <div className="rounded-lg border border-line bg-white focus-within:border-clay focus-within:ring-2 focus-within:ring-clay/30">
      <div className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-1.5">
        {COMMANDS.map((c) => (
          <button
            key={c.command}
            type="button"
            title={c.title}
            // preventDefault keeps the editor selection while clicking a button.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(c)}
            className={`min-w-8 rounded px-2 py-1 text-sm text-ink-soft hover:bg-surface hover:text-ink ${
              c.command === "bold"
                ? "font-bold"
                : c.command === "italic"
                  ? "italic"
                  : c.command === "underline"
                    ? "underline"
                    : "font-medium"
            }`}
          >
            {c.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-line" />
        <button
          type="button"
          title="Clear formatting"
          onMouseDown={(e) => e.preventDefault()}
          onClick={clearFormatting}
          className="rounded px-2 py-1 text-sm text-ink-faint hover:bg-surface hover:text-ink"
        >
          Clear
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        style={{ minHeight }}
        className="rte-content w-full overflow-y-auto px-3 py-2.5 text-sm leading-relaxed text-ink focus:outline-none [&_a]:text-clay [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
}
