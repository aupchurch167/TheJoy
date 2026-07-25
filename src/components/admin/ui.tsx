import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Admin UI kit. Server-safe styled primitives so every admin screen shares one
 * visual language: type scale, spacing, radii, shadows, and color usage.
 *
 * Tokens (globals.css): clay = primary, sage = success, gold = warning,
 * danger = destructive, line = borders, surface = subtle hover, paper = page.
 * Radii: inputs/buttons rounded-lg, cards rounded-xl, badges/pills rounded-full.
 */

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-clay text-white hover:bg-clay-dark focus-visible:outline-clay shadow-sm",
  secondary:
    "bg-white text-ink border border-line hover:bg-surface focus-visible:outline-clay",
  danger:
    "bg-danger text-white hover:bg-danger-dark focus-visible:outline-danger shadow-sm",
  ghost: "text-ink-soft hover:bg-surface hover:text-ink focus-visible:outline-clay",
};

const SIZE: Record<ButtonSize, string> = {
  // min-h keeps every button a >=44px touch target on md/lg; sm is for dense rows.
  sm: "min-h-9 px-3 py-1.5 text-sm gap-1.5",
  md: "min-h-11 px-4 py-2.5 text-sm gap-2",
  lg: "min-h-12 px-6 py-3 text-base gap-2",
};

/** Class string for a button/link, so <button> and <Link> can share styling. */
export function btn(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = ""
): string {
  return `inline-flex items-center justify-center rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT[variant]} ${SIZE[size]} ${extra}`;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={btn(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

/** Link styled as a button. */
export function ButtonLink({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link href={href} className={btn(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <div className="mb-8">
      {breadcrumb}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}

/** Breadcrumb + back link for detail pages. */
export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="mb-3 flex items-center gap-1.5 text-sm text-ink-faint">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden>/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-clay">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink-soft">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-clay hover:text-clay-dark"
    >
      <span aria-hidden>&larr;</span>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Cards & sections                                                    */
/* ------------------------------------------------------------------ */

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-line bg-white shadow-sm ${padded ? "p-6" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/** Small uppercase section label. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
      {children}
    </h2>
  );
}

/* ------------------------------------------------------------------ */
/* Badges / pills                                                      */
/* ------------------------------------------------------------------ */

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: "bg-line/70 text-ink-soft",
  success: "bg-sage/15 text-sage",
  warning: "bg-gold/15 text-gold",
  danger: "bg-danger/10 text-danger",
  info: "bg-clay/10 text-clay",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_TONE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Form fields                                                         */
/* ------------------------------------------------------------------ */

const FIELD_BASE =
  "w-full rounded-lg border bg-white px-3 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30 disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-ink"
      >
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  className = "",
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={`${FIELD_BASE} h-11 ${error ? "border-danger focus:border-danger focus:ring-danger/30" : "border-line"} ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  className = "",
  error,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return (
    <textarea
      className={`${FIELD_BASE} py-2.5 ${error ? "border-danger focus:border-danger focus:ring-danger/30" : "border-line"} ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`${FIELD_BASE} h-11 border-line pr-8 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

/** Scroll-on-mobile wrapper + consistent table chrome. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
      <table className="w-full min-w-[36rem] text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-faint ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={`px-4 py-3 align-middle ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white px-6 py-14 text-center">
      {icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-2xl">
          {icon}
        </div>
      )}
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stat card                                                           */
/* ------------------------------------------------------------------ */

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  tone?: BadgeTone;
}) {
  const accent: Record<BadgeTone, string> = {
    neutral: "text-ink",
    success: "text-sage",
    warning: "text-gold",
    danger: "text-danger",
    info: "text-clay",
  };
  return (
    <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p className={`mt-1.5 font-display text-3xl font-semibold ${accent[tone]}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Not-connected notice (shared DB-missing state)                      */
/* ------------------------------------------------------------------ */

export function NotConnected({ what = "This page" }: { what?: string }) {
  return (
    <EmptyState
      icon="🔌"
      title="Database not connected"
      description={
        <>
          {what} needs a database. Set <code>DATABASE_URL</code> and the schema
          applies automatically on the next deploy (see OPERATIONS.md).
        </>
      }
    />
  );
}
