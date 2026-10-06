import { HOME_GUIDES, HOME_LOGANVILLE_OPTIONS } from "@/lib/site";

/**
 * Homepage body links to pages that otherwise appear only in the footer.
 * Link text is each page's existing document title, plus one educational
 * link into the Loganville options page (anchor fixed in site.ts).
 */
export default function HomeGuides() {
  const [first, second, third, fourth] = HOME_GUIDES;
  return (
    <section>
      <div className="mx-auto max-w-2xl px-5 pb-4">
        <p className="text-lg leading-relaxed text-ink-soft">
          Read{" "}
          <a href={first.href} className="font-semibold text-clay underline">
            {first.title}
          </a>
          ,{" "}
          <a href={second.href} className="font-semibold text-clay underline">
            {second.title}
          </a>
          ,{" "}
          <a href={third.href} className="font-semibold text-clay underline">
            {third.title}
          </a>
          , and{" "}
          <a href={fourth.href} className="font-semibold text-clay underline">
            {fourth.title}
          </a>
          .
        </p>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          {HOME_LOGANVILLE_OPTIONS.lead}
          <a
            href={HOME_LOGANVILLE_OPTIONS.href}
            className="font-semibold text-clay underline"
          >
            {HOME_LOGANVILLE_OPTIONS.anchor}
          </a>
          {HOME_LOGANVILLE_OPTIONS.tail}
        </p>
      </div>
    </section>
  );
}
