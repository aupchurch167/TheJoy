"use client";

import { useRouter } from "next/navigation";
import { Td, ButtonLink } from "@/components/admin/ui";
import { StatusPill, TierBadge } from "@/components/admin/PartnerBadges";
import { orDash, formatDate } from "@/lib/format";
import {
  CATEGORY_LABEL,
  OWNER_LABEL,
  isDueThisWeek,
  formatWeekdayShort,
} from "@/lib/partners-vocab";
import type { Partner } from "@/lib/partners";

/**
 * One partner row. The whole row is a click target to the detail page, but
 * clicks on inner links/buttons/inputs are left alone. Two column layouts:
 * "default" (full pipeline view) and "due" (the Due-this-week work queue).
 */
export default function PartnerRow({
  partner: p,
  href,
  variant = "default",
}: {
  partner: Partner;
  href: string;
  variant?: "default" | "due";
}) {
  const router = useRouter();

  function onRowClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("a,button,select,input,label")) return;
    router.push(href);
  }

  const contact = (
    <div className="min-w-0">
      <div className="truncate font-medium text-ink">{orDash(p.contact_name)}</div>
      {p.contact_role && (
        <div className="truncate text-xs text-ink-faint">{p.contact_role}</div>
      )}
    </div>
  );

  const due = isDueThisWeek(p.next_date);
  const nextDateCell = p.next_date ? (
    <span
      className={
        due ? "font-semibold text-[#8a6217]" : "text-ink-soft"
      }
    >
      {formatWeekdayShort(p.next_date)}
    </span>
  ) : (
    <span className="text-ink-faint">Not set</span>
  );

  const orgCell = (
    <span className="font-medium text-clay">{p.organization}</span>
  );

  if (variant === "due") {
    return (
      <tr
        className="cursor-pointer transition-colors hover:bg-surface"
        onClick={onRowClick}
      >
        <Td className="whitespace-nowrap">{nextDateCell}</Td>
        <Td>{orgCell}</Td>
        <Td>{contact}</Td>
        <Td className="whitespace-nowrap text-ink-soft">
          {OWNER_LABEL[p.owner]}
        </Td>
        <Td><StatusPill status={p.status} /></Td>
        <Td className="text-right">
          <ButtonLink href={`${href}#log`} variant="secondary" size="sm">
            Log touch
          </ButtonLink>
        </Td>
      </tr>
    );
  }

  return (
    <tr
      className="cursor-pointer transition-colors hover:bg-surface"
      onClick={onRowClick}
    >
      <Td>{orgCell}</Td>
      <Td>{contact}</Td>
      <Td className="whitespace-nowrap text-ink-soft">
        {CATEGORY_LABEL[p.category] ?? p.category}
      </Td>
      <Td>
        <TierBadge tier={p.tier} />
      </Td>
      <Td><StatusPill status={p.status} /></Td>
      <Td className="text-ink-soft">{orDash(p.next_action)}</Td>
      <Td className="whitespace-nowrap">{nextDateCell}</Td>
      <Td className="whitespace-nowrap text-ink-faint">
        {p.last_touch_at ? formatDate(p.last_touch_at) : "Never"}
      </Td>
    </tr>
  );
}
