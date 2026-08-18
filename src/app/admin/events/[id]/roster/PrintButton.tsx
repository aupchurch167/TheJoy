"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-[9px] bg-clay px-4 py-2 text-sm font-bold text-white shadow-[0_2px_6px_rgba(1,167,206,0.35)] hover:opacity-95"
    >
      🖨 Print / save PDF
    </button>
  );
}
