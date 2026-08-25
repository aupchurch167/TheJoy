/**
 * Employee lifecycle automations built on the pulse-survey engine:
 *
 *  - Onboarding check-ins: a new hire is enrolled in 30/60/90-day surveys,
 *    each scheduled (send_after) for hire date + offset. The cron sends them
 *    when due.
 *  - Exit interview: when someone leaves (archived/removed in Connecteam) they
 *    get an anonymous exit survey, sent on the next cron run.
 *
 * The surveys are seeded once as system templates (stable system_key) and are
 * editable in the admin like any other survey.
 */

import { query } from "./db";
import { getEmployeeById } from "./employees";
import {
  createScheduledRecipient,
  listDueRecipients,
  markRecipientSent,
  type SurveyQuestion,
  type SurveyChannel,
} from "./employee-feedback";
import { sendEmployeeSurveyInvitation, emailEnabled } from "./email";
import { smsEnabled, sendSms, toE164 } from "./sms";
import { SITE_URL } from "./site";

// Don't back-enroll tenured staff on the first sync: only people hired within
// this window are treated as genuine new hires.
const NEW_HIRE_WINDOW_DAYS = 21;

const ONBOARDING_QUESTIONS: SurveyQuestion[] = [
  { key: "supported", label: "How supported do you feel so far?", type: "rating" },
  {
    key: "equipped",
    label: "Do you have what you need to do the job well?",
    type: "rating",
  },
  { key: "going_well", label: "What's going well?", type: "text" },
  { key: "needs", label: "What would help you settle in?", type: "text" },
];

const EXIT_QUESTIONS: SurveyQuestion[] = [
  {
    key: "overall",
    label: "Overall, how was your time working at Joy?",
    type: "rating",
  },
  { key: "reason", label: "What's the main reason you're moving on?", type: "text" },
  { key: "better", label: "What could Joy have done better?", type: "text" },
  { key: "good", label: "What did we do well?", type: "text" },
];

type Template = {
  systemKey: string;
  title: string;
  intro: string;
  kind: "onboarding" | "exit";
  offsetDays: number;
  anonymous: boolean;
  questions: SurveyQuestion[];
};

const TEMPLATES: Template[] = [
  {
    systemKey: "onboarding_30",
    title: "First month check-in",
    intro: "A quick check-in now that you've been with us about a month.",
    kind: "onboarding",
    offsetDays: 30,
    anonymous: false,
    questions: ONBOARDING_QUESTIONS,
  },
  {
    systemKey: "onboarding_60",
    title: "Two-month check-in",
    intro: "You're two months in. How is it going?",
    kind: "onboarding",
    offsetDays: 60,
    anonymous: false,
    questions: ONBOARDING_QUESTIONS,
  },
  {
    systemKey: "onboarding_90",
    title: "Ninety-day check-in",
    intro: "Ninety days in. A short check-in on how settled you feel.",
    kind: "onboarding",
    offsetDays: 90,
    anonymous: false,
    questions: ONBOARDING_QUESTIONS,
  },
  {
    systemKey: "exit",
    title: "Exit interview",
    intro:
      "We're sorry to see you go. Your honest feedback helps Joy be a better place to work. This is anonymous.",
    kind: "exit",
    offsetDays: 0,
    anonymous: true,
    questions: EXIT_QUESTIONS,
  },
];

type TemplateRow = {
  id: string;
  system_key: string;
  kind: string;
  send_offset_days: number | null;
  auto_enroll: boolean;
  status: string;
};

/** Seed the system templates once (idempotent) and return them. */
export async function ensureLifecycleSurveys(): Promise<TemplateRow[]> {
  for (const t of TEMPLATES) {
    await query(
      `INSERT INTO employee_surveys
         (title, intro, questions, anonymous, status, kind, system_key,
          send_offset_days, auto_enroll, created_by)
       VALUES ($1, $2, $3::jsonb, $4, 'open', $5, $6, $7, TRUE, 'system')
       ON CONFLICT (system_key) DO NOTHING`,
      [
        t.title,
        t.intro,
        JSON.stringify(t.questions),
        t.anonymous,
        t.kind,
        t.systemKey,
        t.offsetDays,
      ]
    );
  }
  return query<TemplateRow>(
    `SELECT id, system_key, kind, send_offset_days, auto_enroll, status
       FROM employee_surveys WHERE system_key IS NOT NULL`
  );
}

function channelFor(e: {
  email: string | null;
  phone: string | null;
  sms_consent: boolean;
}): SurveyChannel | null {
  const wantEmail = emailEnabled() && !!e.email;
  const wantSms = smsEnabled() && !!e.phone && e.sms_consent;
  if (wantEmail && wantSms) return "both";
  if (wantEmail) return "email";
  if (wantSms) return "sms";
  return null;
}

function daysBetween(fromIso: string, toDate: Date): number {
  return (toDate.getTime() - new Date(fromIso).getTime()) / 86_400_000;
}

/**
 * Enroll a genuinely-new hire in the onboarding check-ins. No-op for people
 * hired more than NEW_HIRE_WINDOW_DAYS ago (prevents back-enrolling tenured
 * staff on the first sync) and for steps whose send date is already past.
 */
export async function enrollNewHire(employeeId: string): Promise<void> {
  const e = await getEmployeeById(employeeId);
  if (!e || !e.active) return;
  const channel = channelFor(e);
  if (!channel) return; // no way to reach them

  const now = new Date();
  const hireIso = (e.hire_date ?? e.created_at).slice(0, 10);
  if (daysBetween(hireIso, now) > NEW_HIRE_WINDOW_DAYS) return; // not actually new

  const templates = await ensureLifecycleSurveys();
  const onboarding = templates.filter(
    (t) => t.kind === "onboarding" && t.auto_enroll && t.status !== "closed"
  );

  const hireMs = new Date(hireIso).getTime();
  for (const t of onboarding) {
    const sendAfter = new Date(hireMs + (t.send_offset_days ?? 0) * 86_400_000);
    // Skip steps already in the past (with a small grace) so a mid-window hire
    // doesn't get an immediate blast of missed check-ins.
    if (sendAfter.getTime() < now.getTime() - 2 * 86_400_000) continue;
    await createScheduledRecipient(
      t.id,
      employeeId,
      channel,
      sendAfter.toISOString()
    );
  }
}

/** Enroll someone who just left in the exit survey (sent on the next cron run). */
export async function enrollExit(employeeId: string): Promise<void> {
  const e = await getEmployeeById(employeeId);
  if (!e || !e.email) return; // exit survey goes by email
  const templates = await ensureLifecycleSurveys();
  const exit = templates.find(
    (t) => t.kind === "exit" && t.auto_enroll && t.status !== "closed"
  );
  if (!exit) return;
  // Email even though they're now inactive; send on the next run.
  await createScheduledRecipient(exit.id, employeeId, "email", new Date().toISOString());
}

/**
 * Send scheduled check-ins whose time has come. Called by the cron. Returns how
 * many invitations went out.
 */
export async function processScheduledCheckins(now: Date): Promise<number> {
  const due = await listDueRecipients(now.toISOString());
  let sent = 0;
  for (const d of due) {
    let delivered = false;
    const wantEmail =
      (d.channel === "email" || d.channel === "both") && emailEnabled() && !!d.email;
    const wantSms =
      (d.channel === "sms" || d.channel === "both") &&
      smsEnabled() &&
      !!d.phone &&
      d.sms_consent;

    if (wantEmail) {
      try {
        const ok = await sendEmployeeSurveyInvitation({
          name: d.name,
          email: d.email,
          token: d.token,
          surveyTitle: d.survey_title,
          anonymous: d.anonymous,
        });
        delivered = delivered || ok;
      } catch (e) {
        console.error("[lifecycle] email failed", d.recipient_id, e);
      }
    }
    if (wantSms && d.phone) {
      const to = toE164(d.phone);
      if (to) {
        const url = `${SITE_URL}/pulse/${d.token}`;
        const first = d.name.trim().split(/\s+/)[0] || "there";
        try {
          const res = await sendSms(
            to,
            `Hi ${first}, it's Joy Senior Living. A quick check-in (about 2 minutes): ${url}\n\nReply STOP to opt out.`
          );
          delivered = delivered || res.ok;
        } catch (e) {
          console.error("[lifecycle] sms failed", d.recipient_id, e);
        }
      }
    }

    if (delivered) {
      await markRecipientSent(d.recipient_id);
      sent++;
    }
  }
  return sent;
}
