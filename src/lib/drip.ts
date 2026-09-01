import { BUSINESS, TESTIMONIALS, TOUR_URL } from "./site";
import { sendMarketingEmail } from "./email";
import { advanceDrip, getDripCandidates, type Lead } from "./leads";
import { query } from "./db";
import { getIntegrationState, setIntegrationState } from "./integration-state";

// A lead never gets two drip steps closer together than this, even when several
// steps are overdue (e.g. after the worker was off for a while). Keeps a
// backlog from going out as a burst.
const MIN_HOURS_BETWEEN_STEPS = 20;
const DRIP_PAUSED_KEY = "drip_paused";

/**
 * The lead nurture drip. Steps are absolute-scheduled from the lead's signup:
 * `delayDays` is days after signup this step should go out. A lead's
 * `drip_step` counts how many steps it has been sent, so the next step to
 * consider is DRIP_STEPS[drip_step].
 *
 * All copy follows §2 (voice) and §4 (compliance). No fabricated stories: the
 * "family story" step only quotes real testimonials from lib/site.ts.
 */

const first = (name: string) => name.split(" ")[0] || "there";

export type DripStep = {
  key: string;
  delayDays: number;
  subject: string;
  body: (lead: Lead) => string;
};

const signoff = `Warmly,\n\n${BUSINESS.director.name}, ${BUSINESS.director.title}\n${BUSINESS.name}`;

export const DRIP_STEPS: DripStep[] = [
  {
    key: "welcome",
    delayDays: 0,
    subject: `Thank you for reaching out to ${BUSINESS.name}`,
    body: (lead) =>
      `Hi ${first(lead.name)},

Thank you for reaching out to ${BUSINESS.name}. Someone here will be in touch soon. If you would like to talk sooner, call us at **${BUSINESS.phone}** and ask for ${BUSINESS.director.name.split(" ")[0]}.

Joy is a small personal care home in Loganville, with room for ${BUSINESS.beds} residents. We built it so a parent is known by name, not by room number.

${signoff}`,
  },
  {
    key: "what-small-means",
    delayDays: 2,
    subject: `What "small" actually means at ${BUSINESS.name}`,
    body: (lead) =>
      `Hi ${first(lead.name)},

Most senior living counts residents in the hundreds. Joy has ${BUSINESS.beds} beds. That number is the whole point.

${BUSINESS.director.name} and her team learn how your mother takes her coffee and which chair your father claims after breakfast. When something changes (a harder night, a lost appetite), someone notices that day, not next week.

Joy is a personal care home: help with bathing and dressing, medications on time, real meals at a shared table, and the steady company of people who know your parent well.

If you have questions, just reply to this email or call ${BUSINESS.phone}.

${signoff}`,
  },
  {
    key: "family-story",
    delayDays: 5,
    subject: `A word from a family at ${BUSINESS.name}`,
    body: (lead) => {
      const real = TESTIMONIALS.find((t) => t.quote.trim() !== "");
      const quoteBlock = real
        ? `> "${real.quote}"\n>\n> (${real.name})\n\n`
        : "";
      return `Hi ${first(lead.name)},

We do not say much about ourselves here. We would rather let the people who live at Joy speak.

${quoteBlock}Moving a parent is hard, and the worry does not switch off. What families tell us, again and again, is that the worry eases once their parent is known by name. That is what ${BUSINESS.director.name} and the team work for every day.

${signoff}`;
    },
  },
  {
    key: "tour-invitation",
    delayDays: 8,
    subject: `Come see ${BUSINESS.name} for yourself`,
    body: (lead) =>
      `Hi ${first(lead.name)},

The best way to know if Joy is right for your parent is to walk through it. See the porch, the shared table, the room your parent might have. Meet ${BUSINESS.director.name}.

You can [book a tour here](${TOUR_URL}), or simply call **${BUSINESS.phone}**. No pressure, no sales pitch. Just an honest look.

${signoff}`,
  },
];

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}
function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

/** Global kill switch for the nurture drip (admin-toggleable). */
export async function isDripPaused(): Promise<boolean> {
  try {
    const s = await getIntegrationState<{ paused?: boolean }>(DRIP_PAUSED_KEY);
    return !!s?.paused;
  } catch {
    return false;
  }
}
export async function setDripPaused(paused: boolean): Promise<void> {
  await setIntegrationState(DRIP_PAUSED_KEY, { paused });
}

/**
 * Enroll a brand-new lead: send the welcome (step 0) right away so families get
 * an instant confirmation, then advance the drip position. Best-effort; a send
 * failure does not throw (the lead is already saved).
 */
export async function enrollLead(lead: Lead): Promise<void> {
  const step = DRIP_STEPS[0];
  try {
    await sendMarketingEmail(lead, step.subject, step.body(lead));
  } catch (err) {
    console.error("[drip] welcome send failed for", lead.email, err);
  }
  const nextStatus = DRIP_STEPS.length > 1 ? "active" : "completed";
  await advanceDrip(lead.id, 1, nextStatus);
}

/**
 * Run the drip for all active, opted-in leads whose next step is due.
 * Called by the cron endpoint. Returns how many emails were sent.
 */
export async function runDrip(): Promise<number> {
  if (await isDripPaused()) return 0;
  const leads = await getDripCandidates();
  let sent = 0;

  for (const lead of leads) {
    const stepIndex = lead.drip_step;
    if (stepIndex >= DRIP_STEPS.length) {
      await advanceDrip(lead.id, stepIndex, "completed");
      continue;
    }
    const step = DRIP_STEPS[stepIndex];
    if (daysSince(lead.created_at) < step.delayDays) continue;
    // Never send two steps to the same lead within the minimum gap, so an
    // overdue backlog trickles out (one per day) instead of all at once.
    if (lead.last_drip_at && hoursSince(lead.last_drip_at) < MIN_HOURS_BETWEEN_STEPS)
      continue;

    try {
      const ok = await sendMarketingEmail(lead, step.subject, step.body(lead));
      if (!ok) continue; // email not configured; try again next run
    } catch (err) {
      console.error("[drip] send failed for", lead.email, err);
      continue;
    }

    const nextStep = stepIndex + 1;
    const status = nextStep >= DRIP_STEPS.length ? "completed" : "active";
    await advanceDrip(lead.id, nextStep, status);
    sent++;
  }

  return sent;
}

/* ------------------------------------------------------------------ */
/* Visibility: what the drip is doing (for the admin)                  */
/* ------------------------------------------------------------------ */

const DAY = 86_400_000;

export type DripStepMeta = {
  index: number;
  key: string;
  subject: string;
  delayDays: number;
};
export function dripStepsMeta(): DripStepMeta[] {
  return DRIP_STEPS.map((s, i) => ({
    index: i,
    key: s.key,
    subject: s.subject,
    delayDays: s.delayDays,
  }));
}

export type DripOverview = {
  active: number;
  completed: number;
  paused: number;
};
export async function dripOverview(): Promise<DripOverview> {
  const rows = await query<{ drip_status: string; n: string }>(
    `SELECT drip_status, COUNT(*) AS n
       FROM leads WHERE audience = 'leads'
      GROUP BY drip_status`
  );
  const by = (s: string) => Number(rows.find((r) => r.drip_status === s)?.n ?? 0);
  return { active: by("active"), completed: by("completed"), paused: by("paused") };
}

/** When a lead's current step is next eligible to send. */
function nextDueMs(lead: Lead): number {
  const byDelay =
    new Date(lead.created_at).getTime() + DRIP_STEPS[lead.drip_step].delayDays * DAY;
  const byGap = lead.last_drip_at
    ? new Date(lead.last_drip_at).getTime() + MIN_HOURS_BETWEEN_STEPS * 3_600_000
    : 0;
  return Math.max(byDelay, byGap);
}

export type UpcomingDrip = {
  id: string;
  name: string;
  email: string | null;
  stepIndex: number;
  subject: string;
  dueIso: string;
  overdue: boolean;
};

/** Active leads' next drip email, soonest first (the "to be sent" list). */
export async function upcomingDripSends(limit = 100): Promise<UpcomingDrip[]> {
  const leads = await getDripCandidates();
  const now = Date.now();
  const items = leads
    .filter((l) => l.drip_step < DRIP_STEPS.length)
    .map((l) => {
      const due = nextDueMs(l);
      return {
        id: l.id,
        name: l.name,
        email: l.email,
        stepIndex: l.drip_step,
        subject: DRIP_STEPS[l.drip_step].subject,
        dueIso: new Date(Math.max(due, now)).toISOString(),
        overdue: due <= now,
      };
    });
  items.sort((a, b) => a.dueIso.localeCompare(b.dueIso));
  return items.slice(0, limit);
}

export type RecentDrip = {
  id: string;
  name: string;
  email: string | null;
  subject: string;
  sentIso: string;
};

/** Leads whose last drip email went out recently (what has already sent). */
export async function recentDripSends(days = 14, limit = 100): Promise<RecentDrip[]> {
  const rows = await query<{
    id: string;
    name: string;
    email: string | null;
    drip_step: number;
    last_drip_at: string;
  }>(
    `SELECT id, name, email, drip_step, last_drip_at
       FROM leads
      WHERE audience = 'leads'
        AND last_drip_at IS NOT NULL
        AND last_drip_at >= now() - make_interval(days => $1)
      ORDER BY last_drip_at DESC
      LIMIT $2`,
    [days, limit]
  );
  return rows.map((r) => {
    // drip_step counts steps sent, so the one just sent is index drip_step - 1.
    const idx = Math.max(0, r.drip_step - 1);
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      subject: DRIP_STEPS[idx]?.subject ?? "(drip email)",
      sentIso: r.last_drip_at,
    };
  });
}
