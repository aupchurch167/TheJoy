"use client";

import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";

/** Matches Tailwind's `lg` breakpoint (1024px). Below that, the studio is one column. */
const NARROW = "(max-width: 1023px)";

function fitToContent(el: HTMLTextAreaElement, always: boolean) {
  // Desktop keeps the short fixed height from the className and scrolls inside,
  // unless this field is marked to grow at every width (a one-line box that
  // holds a saved paragraph).
  if (!always && !window.matchMedia(NARROW).matches) {
    el.style.height = "";
    return;
  }
  el.style.height = "auto";
  // border-box: scrollHeight omits the border, so add it or the last line clips.
  const border = el.offsetHeight - el.clientHeight;
  el.style.height = `${el.scrollHeight + border}px`;
}

/**
 * Phone textareas grow with their text, including text that was already saved
 * when the editor opens. Minimum height stays in the className.
 */
export default function AutoTextarea({
  value,
  onChange,
  className = "",
  grow = "narrow",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** "narrow" grows on phones only. "always" also grows on desktop. */
  grow?: "narrow" | "always";
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const always = grow === "always";

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let alive = true;
    const fit = () => {
      if (alive) fitToContent(el, always);
    };
    fit();
    const mq = window.matchMedia(NARROW);
    mq.addEventListener("change", fit);
    window.addEventListener("resize", fit);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => {
      alive = false;
      mq.removeEventListener("change", fit);
      window.removeEventListener("resize", fit);
    };
  }, [value, always]);

  return (
    <textarea
      {...props}
      ref={ref}
      value={value}
      className={className}
      onChange={(e) => {
        fitToContent(e.currentTarget, always);
        onChange?.(e);
      }}
    />
  );
}
