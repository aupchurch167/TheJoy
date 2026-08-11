/**
 * A single family quote card: a Fraunces quote with a name/relationship line
 * and a clay left rule. No carousel, no truncation, no "read more" (README).
 * `align` optionally pushes the card to one side for rhythm on the quote wall.
 */
export default function FamilyQuote({
  quote,
  who,
  align = "start",
  className = "",
}: {
  quote: string;
  who: string;
  align?: "start" | "end";
  className?: string;
}) {
  return (
    <blockquote
      className={`max-w-[34em] rounded-2xl border border-line border-l-[3px] border-l-clay bg-white p-6 shadow-sm ${
        align === "end" ? "self-end" : "self-start"
      } ${className}`}
    >
      <p className="font-display text-xl leading-snug text-ink text-pretty sm:text-2xl">
        {quote}
      </p>
      <footer className="mt-3 text-sm text-ink-faint">{who}</footer>
    </blockquote>
  );
}
