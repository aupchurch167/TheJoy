"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function AdminBar({ email }: { email?: string | null }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/admin" className="font-display text-lg font-semibold text-ink">
            Joy Admin
          </Link>
          <Link href="/admin" className="text-ink-soft hover:text-clay">
            Posts
          </Link>
          <Link href="/admin/leads" className="text-ink-soft hover:text-clay">
            Leads
          </Link>
          <Link href="/admin/emails" className="text-ink-soft hover:text-clay">
            Emails
          </Link>
          <Link href="/admin/families" className="text-ink-soft hover:text-clay">
            Families
          </Link>
          <Link href="/admin/gallery" className="text-ink-soft hover:text-clay">
            Gallery
          </Link>
          <Link href="/admin/seo" className="text-ink-soft hover:text-clay">
            SEO
          </Link>
          <Link href="/admin/settings" className="text-ink-soft hover:text-clay">
            Settings
          </Link>
          <Link href="/" className="text-ink-soft hover:text-clay">
            View site
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm text-ink-faint">
          <span className="hidden sm:inline">{email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="rounded-full border border-line px-3 py-1.5 font-medium text-ink-soft hover:bg-paper"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
