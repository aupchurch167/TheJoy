/**
 * A hairline-divided list of "heading + paragraph" rows: the essay pattern used
 * by /when-its-time (the signs) and /small-home-difference (the contrasts). No
 * icons, no columns, no matrix (README) - just a serif line and a plain body.
 */
export default function EssayRows({
  items,
}: {
  items: { heading: string; body: string }[];
}) {
  return (
    <div className="divide-y divide-line border-t border-line">
      {items.map((it) => (
        <div key={it.heading} className="py-6">
          <p className="font-display text-xl leading-snug text-ink sm:text-2xl">
            {it.heading}
          </p>
          <p className="mt-2 max-w-[34em] text-lg leading-relaxed text-ink-soft">
            {it.body}
          </p>
        </div>
      ))}
    </div>
  );
}
