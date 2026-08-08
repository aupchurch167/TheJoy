import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getAllPosts } from "@/lib/posts";
import { getAllLeads, getSourceReport, getFamilyMembers } from "@/lib/leads";
import { getAllBroadcasts } from "@/lib/broadcasts";
import { getKeywordTrends, rankLoggingEnabled } from "@/lib/ranks";
import { emailEnabled } from "@/lib/email";
import { storageEnabled } from "@/lib/storage";
import { aiEnabled } from "@/lib/ai";
import { getSettings } from "@/lib/settings";
import { BUSINESS } from "@/lib/site";
import { formatDate, formatPercent } from "@/lib/format";
import {
  PageHeader,
  ButtonLink,
  StatCard,
  Badge,
  Card,
  SectionLabel,
  NotConnected,
  type BadgeTone,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const STAGE: Record<string, { label: string; tone: BadgeTone }> = {
  new: { label: "New", tone: "info" },
  toured: { label: "Toured", tone: "warning" },
  moved_in: { label: "Moved in", tone: "success" },
  lost: { label: "Lost", tone: "neutral" },
};

const POST_TONE: Record<string, BadgeTone> = {
  published: "success",
  scheduled: "warning",
  draft: "neutral",
};

export default async function AdminDashboard() {
  await requireAdmin();

  const quickActions = (
    <>
      <ButtonLink href="/admin/posts/new?ai=1" variant="primary" size="sm">
        ✨ Write with AI
      </ButtonLink>
      <ButtonLink href="/admin/emails/new" variant="secondary" size="sm">
        New email
      </ButtonLink>
    </>
  );

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="A quick read on leads, tours, and the blog."
        />
        <NotConnected what="The dashboard" />
        <div className="mt-6">
          <SetupChecklist
            email={emailEnabled()}
            storage={storageEnabled()}
            ranks={rankLoggingEnabled()}
            ai={aiEnabled()}
            tourConfigured={false}
          />
        </div>
      </>
    );
  }

  const [posts, leads, report, families, broadcasts, settings] =
    await Promise.all([
      getAllPosts(),
      getAllLeads(),
      getSourceReport(),
      getFamilyMembers(),
      getAllBroadcasts(),
      getSettings(),
    ]);
  const trends = rankLoggingEnabled() ? await getKeywordTrends(30) : [];

  // Lead metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.stage === "new").length;
  const toured = report.reduce((n, r) => n + r.toured, 0);
  const movedIn = report.reduce((n, r) => n + r.moved_in, 0);
  const tourRate = totalLeads > 0 ? toured / totalLeads : null;

  // Content metrics
  const published = posts.filter((p) => p.status === "published").length;
  const draftPosts = posts.filter((p) => p.status === "draft").length;
  const scheduledPosts = posts.filter((p) => p.status === "scheduled").length;
  const draftEmails = broadcasts.filter((b) => b.status === "draft").length;

  const bestRank = trends.reduce<number | null>((best, t) => {
    if (t.latest == null) return best;
    return best == null ? t.latest : Math.min(best, t.latest);
  }, null);

  const recentLeads = leads.slice(0, 5);
  const recentPosts = posts.slice(0, 5);
  const tourConfigured =
    !!settings.talkfurther_url && settings.talkfurther_url !== BUSINESS.phoneHref;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A quick read on leads, tours, and the blog."
        actions={quickActions}
      />

      {/* Headline metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="New leads"
          value={newLeads}
          hint={`${totalLeads} total`}
          tone="info"
        />
        <StatCard
          label="Toured"
          value={toured}
          hint={`${formatPercent(tourRate)} of leads`}
          tone="warning"
        />
        <StatCard label="Moved in" value={movedIn} tone="success" />
        <StatCard
          label="Published posts"
          value={published}
          hint={`${draftPosts} draft · ${scheduledPosts} scheduled`}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent leads */}
        <Card padded={false} className="min-w-0">
          <div className="flex items-center justify-between px-5 py-4">
            <SectionLabel>Recent leads</SectionLabel>
            <Link
              href="/admin/leads"
              className="text-sm font-semibold text-clay hover:text-clay-dark"
            >
              View all →
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="border-t border-line px-5 py-8 text-center text-sm text-ink-faint">
              No leads yet. They&apos;ll appear here as families reach out.
            </p>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {recentLeads.map((l) => {
                const stage = STAGE[l.stage] ?? STAGE.new;
                return (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{l.name}</p>
                      <p className="truncate text-xs text-ink-faint">
                        {l.source || "—"} · {formatDate(l.created_at)}
                      </p>
                    </div>
                    <Badge tone={stage.tone}>{stage.label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Recent posts */}
        <Card padded={false} className="min-w-0">
          <div className="flex items-center justify-between px-5 py-4">
            <SectionLabel>Recent posts</SectionLabel>
            <Link
              href="/admin/posts"
              className="text-sm font-semibold text-clay hover:text-clay-dark"
            >
              View all →
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <div className="border-t border-line px-5 py-8 text-center">
              <p className="text-sm text-ink-faint">No posts yet.</p>
              <ButtonLink
                href="/admin/posts/new?ai=1"
                variant="secondary"
                size="sm"
                className="mt-3"
              >
                ✨ Write with AI
              </ButtonLink>
            </div>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {recentPosts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/posts/${p.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-surface"
                  >
                    <p className="min-w-0 truncate font-medium text-ink">
                      {p.title || "(untitled)"}
                    </p>
                    <Badge tone={POST_TONE[p.status] ?? "neutral"}>
                      {p.status}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Secondary stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Family list" value={families.length} href="/admin/families" />
        <MiniStat label="Email drafts" value={draftEmails} href="/admin/emails" />
        <MiniStat
          label="Best SEO rank"
          value={bestRank != null ? `#${bestRank}` : "—"}
          href="/admin/seo"
        />
        <MiniStat label="All leads" value={totalLeads} href="/admin/leads" />
      </div>

      {/* Setup / integrations health */}
      <div className="mt-8">
        <SetupChecklist
          email={emailEnabled()}
          storage={storageEnabled()}
          ranks={rankLoggingEnabled()}
          ai={aiEnabled()}
          tourConfigured={tourConfigured}
        />
      </div>
    </>
  );
}

function MiniStat({
  label,
  value,
  href,
}: {
  label: string;
  value: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-line bg-white p-4 shadow-sm transition-colors hover:bg-surface"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink">{value}</p>
    </Link>
  );
}

function SetupChecklist({
  email,
  storage,
  ranks,
  ai,
  tourConfigured,
}: {
  email: boolean;
  storage: boolean;
  ranks: boolean;
  ai: boolean;
  tourConfigured: boolean;
}) {
  const items: { label: string; on: boolean; note: string }[] = [
    {
      label: "Tour booking (TalkFurther)",
      on: tourConfigured,
      note: tourConfigured ? "Configured" : "Using phone fallback",
    },
    {
      label: "Email sending (Resend)",
      on: email,
      note: email ? "Ready" : "Set RESEND_API_KEY",
    },
    {
      label: "AI post drafting (Anthropic)",
      on: ai,
      note: ai ? "Ready" : "Set ANTHROPIC_API_KEY",
    },
    {
      label: "Photo uploads (S3 / R2)",
      on: storage,
      note: storage ? "Ready" : "Paste URLs until set up",
    },
    {
      label: "SEO rank logging (SerpApi)",
      on: ranks,
      note: ranks ? "Logging nightly" : "Set SERPAPI_KEY",
    },
  ];

  return (
    <Card padded={false}>
      <div className="px-5 py-4">
        <SectionLabel>Setup</SectionLabel>
        <p className="mt-1 text-sm text-ink-soft">
          Which integrations are live. See OPERATIONS.md to turn any of these on.
        </p>
      </div>
      <ul className="divide-y divide-line border-t border-line">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between gap-3 px-5 py-3"
          >
            <span className="flex items-center gap-2.5">
              <span
                aria-hidden
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  item.on ? "bg-sage/20 text-sage" : "bg-gold/20 text-gold"
                }`}
              >
                {item.on ? "✓" : "!"}
              </span>
              <span className="text-sm font-medium text-ink">{item.label}</span>
            </span>
            <Badge tone={item.on ? "success" : "warning"}>{item.note}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}
