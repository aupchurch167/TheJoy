import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS, OG_IMAGE } from "@/lib/site";
import {
  getLinkInBio,
  deriveDomain,
  LINKINBIO_TOUR_HREF,
  LINKINBIO_LICENSE_LINE,
  type LinkRow,
} from "@/lib/linkinbio";
import { hasDatabase } from "@/lib/db";
import { getPublishedPosts } from "@/lib/posts";
import Photo from "@/components/Photo";
import LeadForm from "@/components/LeadForm";

// Live: staff edits in /admin/links show on the next render.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Joy Senior Living",
  description: BUSINESS.descriptor,
  // A social-bio hub that duplicates the homepage CTAs. Keep it out of the
  // index so it does not compete with the real pages.
  robots: { index: false, follow: true },
  openGraph: {
    title: BUSINESS.name,
    description: BUSINESS.descriptor,
    url: "/links",
    type: "website",
    images: [OG_IMAGE],
  },
};

/** External links open in a new tab; internal, tel:, mailto: stay in-tab. */
function targetProps(href: string) {
  return /^https?:\/\//i.test(href)
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};
}

const PhoneIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className="shrink-0"
  >
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2Z" />
  </svg>
);

const PinIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className="shrink-0"
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

export default async function LinksPage() {
  const c = await getLinkInBio();
  const domain = deriveDomain(c.siteHref);
  const trust = c.trust.filter((r) => r.href.trim() && r.label.trim());
  const community = c.community.filter((r) => r.href.trim() && r.label.trim());

  // Most recent published post for the preview card (hidden if none / no DB).
  const latest =
    c.showBlog && hasDatabase()
      ? await getPublishedPosts(1).then((p) => p[0]).catch(() => undefined)
      : undefined;

  return (
    <main className="flex flex-1 justify-center bg-paper">
      <div className="flex w-full max-w-[30rem] flex-col gap-9 px-6 pb-16 pt-10">
        {/* Header */}
        <header className="flex flex-col gap-3.5">
          <p className="font-display text-4xl font-semibold leading-none text-ink">
            Joy <span className="text-clay">Senior Living</span>
          </p>
          <p className="font-display text-xl leading-relaxed text-ink-soft text-pretty">
            A 24-bed personal care home in Loganville. Small enough to know her.
          </p>
        </header>

        {/* Photo (only when a real one is set; never stock) */}
        {c.photoUrl.trim() && (
          <div className="relative">
            <Photo
              src={c.photoUrl}
              alt={c.photoCaption || "A moment at Joy Senior Living"}
              priority
              rounded="rounded-2xl"
              sizes="(max-width: 480px) 100vw, 480px"
              className="aspect-[4/3] w-full"
            />
            {c.photoCaption.trim() && (
              <span className="absolute bottom-3 left-3 rounded bg-ink/55 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.04em] text-white/90">
                {c.photoCaption}
              </span>
            )}
          </div>
        )}

        {/* Website link + primary buttons */}
        <div className="flex flex-col gap-3.5">
          <a
            href={c.siteHref}
            {...targetProps(c.siteHref)}
            className="group flex min-h-11 items-center justify-between gap-3 border-b border-clay/25 px-1 pb-3.5 pt-1 text-base font-medium text-clay-dark transition-colors hover:border-clay/60"
          >
            <span className="group-hover:text-clay">{c.siteLabel}</span>
            <span className="font-mono text-xs tracking-[0.04em] text-clay">
              {domain}
            </span>
          </a>

          {/* Tour: the one canonical tour path (not editable). */}
          <a
            href={LINKINBIO_TOUR_HREF}
            className="flex min-h-[3.75rem] items-center justify-center rounded-2xl bg-clay px-5 text-xl font-semibold tracking-[0.01em] text-white shadow-[0_2px_0_rgba(1,63,79,0.35)] transition-colors hover:bg-clay-dark"
          >
            {c.tourLabel}
          </a>

          <a
            href={c.callHref}
            className="flex min-h-14 items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-clay bg-white px-5 text-lg font-semibold text-clay-dark transition-colors hover:bg-clay/[0.06]"
          >
            {PhoneIcon}
            {c.callLabel}
          </a>

          <a
            href={c.dirHref}
            {...targetProps(c.dirHref)}
            className="flex min-h-14 items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-clay bg-white px-5 text-lg font-semibold text-clay-dark transition-colors hover:bg-clay/[0.06]"
          >
            {PinIcon}
            {c.dirLabel}
          </a>
        </div>

        {/* Trust links (tier 2) */}
        {trust.length > 0 && (
          <section className="flex flex-col gap-1.5">
            {trust.map((row: LinkRow, i) => (
              <a
                key={i}
                href={row.href}
                {...targetProps(row.href)}
                className="group flex flex-col gap-0.5 border-b border-ink/[0.14] px-1 py-4 transition-colors hover:border-clay/40"
              >
                <span className="font-semibold text-ink group-hover:text-clay">
                  {row.label}
                </span>
                {row.note.trim() && (
                  <span className="text-sm leading-relaxed text-ink-soft">
                    {row.note}
                  </span>
                )}
              </a>
            ))}
          </section>
        )}

        {/* Community links (tier 3) */}
        {community.length > 0 && (
          <section className="flex flex-col gap-4">
            {community.map((row: LinkRow, i) => (
              <a
                key={i}
                href={row.href}
                {...targetProps(row.href)}
                className="flex min-h-11 flex-col gap-0.5 text-ink-soft transition-colors hover:text-clay"
              >
                <span className="text-[0.95rem] font-medium">{row.label}</span>
                {row.note.trim() && (
                  <span className="text-[0.8rem] leading-relaxed text-ink-faint">
                    {row.note}
                  </span>
                )}
              </a>
            ))}
          </section>
        )}

        {/* Latest blog post preview */}
        {latest && (
          <section className="flex flex-col gap-3">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
              {c.blogHeading}
            </p>
            <Link
              href={`/blog/${latest.slug}`}
              className="group overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow hover:shadow-md"
            >
              {latest.hero_image && (
                <Photo
                  src={latest.hero_image}
                  alt={latest.hero_image_alt || latest.title}
                  rounded="rounded-none"
                  sizes="(max-width: 480px) 100vw, 480px"
                  className="aspect-[16/9] w-full"
                />
              )}
              <div className="flex flex-col gap-1.5 p-5">
                {latest.category && (
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-clay">
                    {latest.category}
                  </span>
                )}
                <span className="font-display text-lg font-semibold leading-snug text-ink group-hover:text-clay">
                  {latest.title}
                </span>
                {latest.excerpt && (
                  <span className="line-clamp-2 text-sm leading-relaxed text-ink-soft">
                    {latest.excerpt}
                  </span>
                )}
                <span className="mt-1 text-sm font-semibold text-clay">
                  Read the post &rarr;
                </span>
              </div>
            </Link>
          </section>
        )}

        {/* Quick lead form */}
        {c.showForm && (
          <section>
            <LeadForm
              compact
              source="links"
              heading={c.formHeading}
              blurb={c.formBlurb}
            />
          </section>
        )}

        {/* Footer */}
        <footer className="flex flex-col gap-1 border-t border-ink/[0.12] pt-5 text-[0.78rem] leading-relaxed text-ink-faint">
          <span>{c.footAddress}</span>
          <span>{c.footPhone}</span>
          <span>{LINKINBIO_LICENSE_LINE}</span>
        </footer>
      </div>
    </main>
  );
}
