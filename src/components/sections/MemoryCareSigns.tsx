"use client";

import { useState } from "react";
import { MEMORY_CARE_EDUCATION } from "@/lib/site";

/**
 * Interactive, educational guide to the behaviors families see with dementia.
 * An accessible disclosure list: each row expands to explain what is happening
 * and how a small, familiar home helps. Keyboard and screen-reader friendly
 * (native <button>, aria-expanded, aria-controls). The first row opens by
 * default so the section never reads as an empty list of headings.
 */
export default function MemoryCareSigns() {
  const { signsHeading, signsLede, signs } = MEMORY_CARE_EDUCATION;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        {signsHeading}
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-ink-soft">{signsLede}</p>

      <div className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {signs.map((sign, i) => {
          const isOpen = open === i;
          const panelId = `sign-panel-${i}`;
          const buttonId = `sign-button-${i}`;
          return (
            <div key={sign.title}>
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
                    {sign.title}
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
                  {sign.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
