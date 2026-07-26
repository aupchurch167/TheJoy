"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOut } from "next-auth/react";

/**
 * Admin sidebar: fixed on desktop, slide-over on mobile. Highlights the active
 * section and gives every screen the same left-hand navigation.
 */

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  /** Extra path prefixes that should also mark this item active. */
  match?: string[];
};

const icon = (path: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5 shrink-0"
    aria-hidden
  >
    {path}
  </svg>
);

const NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: icon(
      <>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </>
    ),
  },
  {
    href: "/admin/posts",
    label: "Posts",
    icon: icon(
      <>
        <path d="M4 4h11l5 5v11a0 0 0 0 1 0 0H4z" />
        <path d="M14 4v5h5" />
        <path d="M8 13h8M8 17h6" />
      </>
    ),
  },
  {
    href: "/admin/leads",
    label: "Leads",
    icon: icon(
      <>
        <path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
        <circle cx="9.5" cy="8" r="3" />
        <path d="M21 20v-1a4 4 0 0 0-3-3.87" />
      </>
    ),
  },
  {
    href: "/admin/emails",
    label: "Emails",
    icon: icon(
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
  },
  {
    href: "/admin/families",
    label: "Families",
    icon: icon(
      <path d="M12 21s-7-4.6-9.3-8.4C1 9.5 2.6 6 6 6c2 0 3.2 1.2 4 2.3C10.8 7.2 12 6 14 6c3.4 0 5 3.5 3.3 6.6C19 16.4 12 21 12 21z" />
    ),
  },
  {
    href: "/admin/texts",
    label: "Texts",
    icon: icon(
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8 8.38 8.38 0 0 1 8.5-8.5 8.38 8.38 0 0 1 8.5 8.5z" />
    ),
  },
  {
    href: "/admin/gallery",
    label: "Gallery",
    icon: icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="m4 18 5-5 4 4 3-3 4 4" />
      </>
    ),
  },
  {
    href: "/admin/photos",
    label: "Site photos",
    icon: icon(
      <>
        <path d="M14.5 4h-5L8 6H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-4z" />
        <circle cx="12" cy="12.5" r="3.2" />
      </>
    ),
  },
  {
    href: "/admin/seo",
    label: "SEO",
    icon: icon(
      <>
        <path d="M4 19V5M4 19h16" />
        <path d="M8 16v-4M12 16V8M16 16v-6" />
      </>
    ),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: icon(
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H2a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H22a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </>
    ),
  },
];

function isActive(pathname: string, item: NavItem): boolean {
  // Dashboard (/admin) is active only on the exact path, not its children.
  if (item.href === "/admin") return pathname === "/admin";
  if (pathname === item.href) return true;
  return (
    pathname.startsWith(item.href) ||
    (item.match ?? []).some((m) => pathname.startsWith(m))
  );
}

export default function AdminNav({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-clay/10 text-clay"
                : "text-ink-soft hover:bg-surface hover:text-ink"
            }`}
          >
            <span className={active ? "text-clay" : "text-ink-faint"}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="mt-auto border-t border-line pt-4">
      <Link
        href="/"
        className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-surface hover:text-ink"
      >
        <span className="text-ink-faint">
          {icon(
            <>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <path d="M15 3h6v6M10 14 21 3" />
            </>
          )}
        </span>
        View site
      </Link>
      {email && (
        <p className="truncate px-3 pt-3 text-xs text-ink-faint" title={email}>
          {email}
        </p>
      )}
      <button
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-surface hover:text-ink"
      >
        <span className="text-ink-faint">
          {icon(
            <>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5M21 12H9" />
            </>
          )}
        </span>
        Sign out
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <Link href="/admin" className="font-display text-lg font-semibold text-ink">
          Joy Admin
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-soft hover:bg-surface"
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-white px-4 py-5 lg:flex">
        <Link
          href="/admin"
          className="mb-6 px-3 font-display text-xl font-semibold text-ink"
        >
          Joy Admin
        </Link>
        {links}
        {footer}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="admin-fade absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
          />
          <div
            className="admin-rise absolute inset-y-0 left-0 flex w-64 flex-col border-r border-line bg-white px-4 py-5"
            onClick={(e) => {
              // Close the drawer when any nav link inside is tapped.
              if ((e.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            <div className="mb-6 flex items-center justify-between px-3">
              <span className="font-display text-xl font-semibold text-ink">
                Joy Admin
              </span>
              <button
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-faint hover:bg-surface"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            {links}
            {footer}
          </div>
        </div>
      )}
    </>
  );
}
