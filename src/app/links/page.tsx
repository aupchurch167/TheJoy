import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS, OG_IMAGE } from "@/lib/site";
import {
  getLinkInBio,
  deriveDomain,
  isBlockLive,
  targetProps,
  LINKINBIO_LICENSE_LINE,
  SOCIAL_PLATFORMS,
  type Block,
  type LinkBlock,
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
  robots: { index: false, follow: true },
  openGraph: {
    title: BUSINESS.name,
    description: BUSINESS.descriptor,
    url: "/links",
    type: "website",
    images: [OG_IMAGE],
  },
};

const COLOR_HEX: Record<string, string> = { blue: "#01a7ce", green: "#24a332" };
const glyphFor = (key: string) =>
  SOCIAL_PLATFORMS.find((p) => p.key === key)?.glyph ?? "•";

function LinkRow({ b }: { b: LinkBlock }) {
  const href = `/l/${b.id}`;
  const hex = COLOR_HEX[b.color] ?? COLOR_HEX.blue;
  const thumb =
    b.showThumb && b.thumbUrl?.trim() ? (
      <Photo
        src={b.thumbUrl}
        alt=""
        rounded="rounded-lg"
        sizes="40px"
        className="h-8 w-8 flex-none"
      />
    ) : null;

  if (b.style === "plain") {
    const domain = b.domain?.trim() || deriveDomain(b.url);
    return (
      <a
        href={href}
        className="group flex min-h-11 items-center justify-between gap-3 border-b border-ink/[0.14] px-1 py-3.5 transition-colors hover:border-clay/50"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {thumb}
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink group-hover:text-clay">
              {b.title}
            </span>
            {b.subtitle.trim() && (
              <span className="block truncate text-sm leading-relaxed text-ink-soft">
                {b.subtitle}
              </span>
            )}
          </span>
        </span>
        {domain && (
          <span className="flex-none font-mono text-xs tracking-[0.02em] text-clay">
            {domain}
          </span>
        )}
      </a>
    );
  }

  // outlined / filled: centered pill
  const pill =
    b.style === "filled"
      ? { background: hex, color: "#fff", border: "none" }
      : { background: "#fff", color: hex, border: `1.5px solid ${hex}` };
  return (
    <a
      href={href}
      className="flex min-h-14 items-center justify-center gap-2.5 rounded-2xl px-5 text-lg font-semibold transition-opacity hover:opacity-90"
      style={pill}
    >
      {thumb}
      <span className="min-w-0 text-center">
        <span className="block truncate">{b.title}</span>
        {b.subtitle.trim() && (
          <span className="block truncate text-sm font-medium opacity-75">
            {b.subtitle}
          </span>
        )}
      </span>
    </a>
  );
}

export default async function LinksPage() {
  const { profile, blocks } = await getLinkInBio();
  const live = blocks.filter((b) => isBlockLive(b));
  const needsBlog = live.some((b) => b.type === "blog");
  const latest =
    needsBlog && hasDatabase()
      ? await getPublishedPosts(1).then((p) => p[0]).catch(() => undefined)
      : undefined;

  return (
    <main className="flex flex-1 justify-center bg-paper">
      <div className="flex w-full max-w-[30rem] flex-col gap-8 px-6 pb-16 pt-10">
        {/* Profile */}
        <header className="flex flex-col items-center gap-2 text-center">
          <p className="font-display text-3xl font-semibold leading-tight text-ink">
            {profile.name}
          </p>
          {profile.bio.trim() && (
            <p className="max-w-[30ch] text-[0.95rem] leading-relaxed text-ink-soft text-pretty">
              {profile.bio}
            </p>
          )}
        </header>

        {profile.photoUrl.trim() && (
          <div className="relative">
            <Photo
              src={profile.photoUrl}
              alt={profile.photoCaption || "A moment at Joy Senior Living"}
              priority
              rounded="rounded-2xl"
              sizes="(max-width: 480px) 100vw, 480px"
              className="aspect-square w-full"
            />
            {profile.photoCaption.trim() && (
              <span className="absolute bottom-3 left-3 rounded bg-ink/55 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.04em] text-white/90">
                {profile.photoCaption}
              </span>
            )}
          </div>
        )}

        {/* Blocks */}
        <div className="flex flex-col gap-4">
          {live.map((b: Block) => {
            if (b.type === "link") return <LinkRow key={b.id} b={b} />;

            if (b.type === "header")
              return (
                <div key={b.id} className="mt-1 border-t border-ink/[0.12] pt-4">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                    {b.text}
                  </p>
                </div>
              );

            if (b.type === "social") {
              const items = b.items.filter((it) => it.enabled && it.url.trim());
              if (!items.length) return null;
              return (
                <div key={b.id} className="flex justify-center gap-3.5">
                  {items.map((it) => (
                    <a
                      key={it.key}
                      href={it.url}
                      {...targetProps(it.url)}
                      aria-label={it.label}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-clay font-serif text-base font-bold text-white transition-colors hover:bg-clay-dark"
                    >
                      {glyphFor(it.key)}
                    </a>
                  ))}
                </div>
              );
            }

            if (b.type === "gallery") {
              const imgs = b.images.filter((u) => u.trim());
              if (!imgs.length) return null;
              return (
                <div key={b.id} className="flex gap-2">
                  {imgs.map((u, i) => (
                    <Photo
                      key={i}
                      src={u}
                      alt=""
                      rounded="rounded-xl"
                      sizes="150px"
                      className="aspect-square flex-1"
                    />
                  ))}
                </div>
              );
            }

            if (b.type === "blog") {
              if (!latest) return null;
              return (
                <section key={b.id} className="flex flex-col gap-3">
                  <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
                    {b.heading}
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
              );
            }

            // form
            return (
              <section key={b.id}>
                <LeadForm compact source="links" heading={b.heading} blurb={b.blurb} />
              </section>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="flex flex-col gap-1 border-t border-ink/[0.12] pt-5 text-[0.78rem] leading-relaxed text-ink-faint">
          <span>{BUSINESS.address.street}, {BUSINESS.address.city}, {BUSINESS.address.state} {BUSINESS.address.zip}</span>
          <span>{BUSINESS.phone}</span>
          <span>{LINKINBIO_LICENSE_LINE}</span>
        </footer>
      </div>
    </main>
  );
}
