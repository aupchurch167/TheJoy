import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Stories from Joy",
  description:
    "Honest writing for families thinking about senior living and memory care near Loganville, Georgia.",
};

// Placeholder index. Phase 2 replaces this with the Postgres-backed blog
// (admin login, editor, AI drafting). Kept as a real page so homepage links
// never dead-end.
export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20">
      <h1 className="font-display text-4xl font-semibold text-ink">
        Stories from Joy
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-soft">
        We are moving our writing over to the new site. Honest, plainspoken
        notes for families thinking about senior living and memory care near
        Loganville are on the way.
      </p>
      <p className="mt-4 text-lg leading-relaxed text-ink-soft">
        In the meantime, the best way to learn about {BUSINESS.name} is to come
        see it. Call {BUSINESS.director.name} at{" "}
        <a href={BUSINESS.phoneHref} className="font-semibold text-clay">
          {BUSINESS.phone}
        </a>
        .
      </p>
      <Link
        href="/"
        className="mt-8 inline-block text-base font-semibold text-clay hover:text-clay-dark"
      >
        Back to home
      </Link>
    </div>
  );
}
