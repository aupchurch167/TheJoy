import Link from "next/link";

/** Heading, paragraphs, and an optional pull quote and link line. */
export default function SectionCopy({
  heading,
  paragraphs,
  pull,
  link,
}: {
  heading: string;
  paragraphs: string[];
  pull?: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        {heading}
      </h2>
      {paragraphs.map((p) => (
        <p key={p} className="max-w-[34em] text-lg leading-relaxed text-ink-soft">
          {p}
        </p>
      ))}
      {pull ? (
        <p className="border-l-[3px] border-clay pl-4 font-display text-xl leading-snug text-ink text-pretty">
          {pull}
        </p>
      ) : null}
      {link ? (
        <p className="text-lg">
          <Link
            href={link.href}
            className="font-semibold text-clay underline underline-offset-2 hover:text-clay-dark"
          >
            {link.label}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
