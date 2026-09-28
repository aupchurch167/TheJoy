import { HOME_GUIDES } from "@/lib/site";

/**
 * Homepage body links to pages that otherwise appear only in the footer.
 * Link text is each page's existing document title.
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
      </div>
    </section>
  );
}
