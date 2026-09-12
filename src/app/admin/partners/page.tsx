import Link from "next/link";
import {
  PageHeader,
  StatCard,
  TableWrap,
  Th,
  EmptyState,
  ButtonLink,
  NotConnected,
} from "@/components/admin/ui";
import { hasDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import {
  listPartners,
  getPartnerStats,
  countDueThisWeek,
} from "@/lib/partners";
import {
  PARTNER_STATUSES,
  PARTNER_TIERS,
  PARTNER_CATEGORIES,
  PARTNER_OWNERS,
  STATUS_LABEL,
  OWNER_LABEL,
} from "@/lib/partners-vocab";
import PartnerRow from "./PartnerRow";
import PartnerFormSlideOver from "./PartnerFormSlideOver";
import ImportPartnersPanel from "./ImportPartnersPanel";

export const dynamic = "force-dynamic";

type SP = {
  q?: string;
  status?: string;
  tier?: string;
  category?: string;
  owner?: string;
  due?: string;
  import?: string;
};

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const dueOnly = sp.due === "1";

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader
          title="Partners"
          description="Who we stay in touch with for referrals"
        />
        <NotConnected what="Partners" />
      </>
    );
  }

  const filters = {
    q,
    status: sp.status,
    tier: sp.tier,
    category: sp.category,
    owner: sp.owner,
    due: dueOnly,
  };

  const [partners, stats, dueCount] = await Promise.all([
    listPartners(filters),
    getPartnerStats(),
    countDueThisWeek(),
  ]);

  const hasFilters =
    !!q || !!sp.status || !!sp.tier || !!sp.category || !!sp.owner;

  // Filter-preserving link builder.
  const hrefWith = (over: Partial<SP>) => {
    const qs = new URLSearchParams();
    const merged: SP = { ...sp, ...over };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") qs.set(k, v);
    }
    const s = qs.toString();
    return `/admin/partners${s ? `?${s}` : ""}`;
  };

  const importOpen = sp.import === "1";

  // Carry active filters into each detail link so its prev/next pager walks the
  // same filtered order (import is a UI-only flag, left out).
  const detailQs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v && v !== "all" && k !== "import") detailQs.set(k, v);
  }
  const detailSuffix = detailQs.toString() ? `?${detailQs.toString()}` : "";

  return (
    <>
      <PageHeader
        title="Partners"
        description={
          dueOnly
            ? "Who to call this week"
            : "Who we stay in touch with for referrals"
        }
        actions={
          <>
            <ButtonLink
              href={hrefWith({ import: importOpen ? undefined : "1" })}
              variant="secondary"
              size="sm"
            >
              Import CSV
            </ButtonLink>
            <PartnerFormSlideOver mode="add" />
          </>
        }
      />

      <ImportPartnersPanel open={importOpen} />

      {/* Stat cards (hidden in the short due-this-week view). */}
      {!dueOnly && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Intros past Attempted" value={stats.intros} />
          <StatCard label="Tours booked" value={stats.tours} tone="warning" />
          <StatCard
            label="Admissions this quarter"
            value={stats.admissions}
            tone="success"
          />
        </div>
      )}

      {/* Filters */}
      <form
        method="get"
        action="/admin/partners"
        className="mb-4 flex flex-wrap items-end gap-2"
      >
        {dueOnly && <input type="hidden" name="due" value="1" />}
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search organization or contact…"
          className="h-10 w-full max-w-xs rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30"
        />
        <select
          name="status"
          defaultValue={sp.status ?? "all"}
          className="h-10 rounded-lg border border-line bg-white px-2 text-sm text-ink"
        >
          <option value="all">All statuses</option>
          {PARTNER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          name="tier"
          defaultValue={sp.tier ?? "all"}
          className="h-10 rounded-lg border border-line bg-white px-2 text-sm text-ink"
        >
          <option value="all">All tiers</option>
          {PARTNER_TIERS.map((t) => (
            <option key={t} value={t}>
              Tier {t}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={sp.category ?? "all"}
          className="h-10 rounded-lg border border-line bg-white px-2 text-sm text-ink"
        >
          <option value="all">All categories</option>
          {PARTNER_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          name="owner"
          defaultValue={sp.owner ?? "all"}
          className="h-10 rounded-lg border border-line bg-white px-2 text-sm text-ink"
        >
          <option value="all">Any owner</option>
          {PARTNER_OWNERS.map((o) => (
            <option key={o} value={o}>
              {OWNER_LABEL[o]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-lg bg-clay px-4 text-sm font-semibold text-white hover:bg-clay-dark"
        >
          Filter
        </button>

        {/* Due this week toggle */}
        {dueOnly ? (
          <Link
            href={hrefWith({ due: undefined })}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#071417] px-4 text-sm font-semibold text-white"
          >
            Due this week
            <span aria-hidden>✕</span>
          </Link>
        ) : (
          <Link
            href={hrefWith({ due: "1" })}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-gold/15 px-4 text-sm font-semibold text-[#8a6217] hover:bg-gold/25"
          >
            Due this week
            {dueCount > 0 && (
              <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-[#8a6217] px-1.5 text-[11px] font-bold text-white">
                {dueCount}
              </span>
            )}
          </Link>
        )}
        {hasFilters && (
          <ButtonLink
            href={dueOnly ? "/admin/partners?due=1" : "/admin/partners"}
            variant="ghost"
            size="sm"
          >
            Clear
          </ButtonLink>
        )}
      </form>

      {dueOnly && (
        <p className="mb-3 font-display text-lg font-semibold text-ink">
          {dueCount} due this week
        </p>
      )}

      {/* Table / empty states */}
      {partners.length === 0 ? (
        dueOnly ? (
          <EmptyState
            icon="✅"
            title="Nothing due this week. Nice."
            description="Nobody needs a call before Sunday. Clear the filter to see everyone."
            action={
              <ButtonLink href="/admin/partners" variant="secondary">
                Show all partners
              </ButtonLink>
            }
          />
        ) : hasFilters ? (
          <EmptyState
            icon="🔍"
            title="No partners match"
            description="Try a different search or clear the filters."
            action={
              <ButtonLink href="/admin/partners" variant="secondary">
                Clear filters
              </ButtonLink>
            }
          />
        ) : (
          <EmptyState
            icon="🤝"
            title="No partners yet"
            description="Import your list or add the first hospital case manager."
            action={
              <div className="flex items-center gap-2">
                <ButtonLink href="/admin/partners?import=1" variant="secondary">
                  Import CSV
                </ButtonLink>
                <PartnerFormSlideOver mode="add" triggerSize="md" />
              </div>
            }
          />
        )
      ) : (
        <TableWrap>
          <thead>
            <tr className="border-b border-line">
              {dueOnly ? (
                <>
                  <Th>Next date</Th>
                  <Th>Organization</Th>
                  <Th>Contact</Th>
                  <Th>Owner</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Log</Th>
                </>
              ) : (
                <>
                  <Th>Organization</Th>
                  <Th>Contact</Th>
                  <Th>Category</Th>
                  <Th>Tier</Th>
                  <Th>Status</Th>
                  <Th>Next action</Th>
                  <Th>Next date</Th>
                  <Th>Last touch</Th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {partners.map((p) => (
              <PartnerRow
                key={p.id}
                partner={p}
                href={`/admin/partners/${p.id}${detailSuffix}`}
                variant={dueOnly ? "due" : "default"}
              />
            ))}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
