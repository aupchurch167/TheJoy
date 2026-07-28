"use client";

import { useState } from "react";

/**
 * An accessible disclosure list (accordion). Each row expands to reveal its
 * body. Keyboard and screen-reader friendly (native <button>, aria-expanded,
 * aria-controls). Pass `defaultOpen` (an index, or null) to control the initial
 * open row; the first row opens by default so the section never reads as an
 * empty list of headings. `idPrefix` keeps ids unique if more than one
 * accordion ever shares a page.
 */
export default function Accordion({
  heading,
  lede,
  items,
  idPrefix = "acc",
  defaultOpen = 0,
}: {
  heading: string;
  lede?: string;
  items: { title: string; body: string }[];
  idPrefix?: string;
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        {heading}
      </h2>
      {lede && (
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">{lede}</p>
      )}

      <div className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {items.map((item, i) => {
          const isOpen = open === i;
          const panelId = `${idPrefix}-panel-${i}`;
          const buttonId = `${idPrefix}-button-${i}`;
          return (
            <div key={item.title}>
              <h3>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-paper/70 sm:px-6"
                >
                  <span className="font-display text-lg font-semibold text-ink">
                    {item.title}
                  </span>
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className={`h-5 w-5 flex-none text-clay transition-transform duration-200 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
                className="px-5 pb-5 sm:px-6"
              >
                <p className="text-lg leading-relaxed text-ink-soft">
                  {item.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
