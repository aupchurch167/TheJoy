/**
 * Internal employee pulse surveys. A survey carries its own question set and a
 * per-survey `anonymous` flag. Each invited employee gets a tokenized link; on
 * an anonymous survey the response is stored with NO employee_id, while the
 * recipient row is still marked completed so response rate keeps working.
 */

import { randomBytes } from "crypto";
import { query } from "./db";

export type SurveyStatus = "draft" | "open" | "closed";
export type SurveyChannel = "email" | "sms" | "both";
export type QuestionType = "rating" | "text";
export type Sentiment = "positive" | "concern";

export type SurveyQuestion = {
  key: string;
  label: string;
  type: QuestionType;
};

export type EmployeeSurvey = {
  id: string;
  title: string;
  intro: string;
  questions: SurveyQuestion[];
  anonymous: boolean;
  status: SurveyStatus;
  created_by: string | null;
  created_at: string;
  closed_at: string | null;
};

export type EmployeeSurveyRecipient = {
  id: string;
  survey_id: string;
  employee_id: string;
  token: string;
  channel: SurveyChannel;
  sent_at: string | null;
  completed_at: string | null;
};

export type EmployeeSurveyResponse = {
  id: string;
  survey_id: string;
  employee_id: string | null;
  answers: Record<string, unknown>;
  comment: string | null;
  sentiment: Sentiment | null;
  submitted_at: string;
};

/** A sensible starter set; the composer can edit, add, or remove any of these. */
export const DEFAULT_QUESTIONS: SurveyQuestion[] = [
  { key: "supported", label: "How supported do you feel in your role?", type: "rating" },
  { key: "workload", label: "How manageable is your workload?", type: "rating" },
  {
    key: "communication",
    label: "How well does communication flow with Mellissa and the team?",
    type: "rating",
  },
  { key: "going_well", label: "What's going well?", type: "text" },
  {
    key: "improve",
    label: "What would make Joy a better place to work?",
    type: "text",
  },
];

// Hex token (lowercase) so it survives the site's path-lowercasing middleware.
function newToken(): string {
  return randomBytes(24).toString("hex");
}

/** Concern if any rating is a 1, or the average rating is 3 or below. */
export function computeSentiment(ratings: number[]): Sentiment | null {
  const vals = ratings.filter((n) => Number.isFinite(n) && n > 0);
  if (vals.length === 0) return null;
  if (vals.some((v) => v === 1)) return "concern";
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return avg <= 3 ? "concern" : "positive";
}

/* ---------------- surveys ---------------- */

export async function createSurvey(input: {
  title: string;
  intro?: string;
  questions: SurveyQuestion[];
  anonymous: boolean;
  createdBy?: string | null;
}): Promise<EmployeeSurvey> {
  const rows = await query<EmployeeSurvey>(
    `INSERT INTO employee_surveys (title, intro, questions, anonymous, created_by)
     VALUES ($1, $2, $3::jsonb, $4, $5)
     RETURNING *`,
    [
      input.title.trim(),
      (input.intro ?? "").trim(),
      JSON.stringify(input.questions),
      input.anonymous,
      input.createdBy ?? null,
    ]
  );
  return rows[0];
}

export async function getSurveyById(id: string): Promise<EmployeeSurvey | null> {
  const rows = await query<EmployeeSurvey>(
    `SELECT * FROM employee_surveys WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export type SurveyListRow = EmployeeSurvey & {
  sent: number;
  completed: number;
};

/** Surveys with their sent / completed counts, newest first. */
export async function listSurveys(): Promise<SurveyListRow[]> {
  return query<SurveyListRow>(
    `SELECT s.*,
            COUNT(r.id) FILTER (WHERE r.sent_at IS NOT NULL)      AS sent,
            COUNT(r.id) FILTER (WHERE r.completed_at IS NOT NULL) AS completed
       FROM employee_surveys s
       LEFT JOIN employee_survey_recipients r ON r.survey_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC`
  );
}

export async function setSurveyStatus(
  id: string,
  status: SurveyStatus
): Promise<void> {
  await query(
    `UPDATE employee_surveys
        SET status = $2,
            closed_at = CASE WHEN $2 = 'closed' THEN now() ELSE closed_at END
      WHERE id = $1`,
    [id, status]
  );
}

export async function deleteSurvey(id: string): Promise<void> {
  await query(`DELETE FROM employee_surveys WHERE id = $1`, [id]);
}

/* ---------------- recipients ---------------- */

/**
 * Ensure a recipient row (with token) exists for this employee on this survey.
 * Idempotent: a repeat call returns the existing row rather than a duplicate.
 */
export async function ensureRecipient(
  surveyId: string,
  employeeId: string,
  channel: SurveyChannel
): Promise<EmployeeSurveyRecipient> {
  const rows = await query<EmployeeSurveyRecipient>(
    `INSERT INTO employee_survey_recipients (survey_id, employee_id, token, channel)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (survey_id, employee_id)
       DO UPDATE SET channel = EXCLUDED.channel
     RETURNING *`,
    [surveyId, employeeId, newToken(), channel]
  );
  return rows[0];
}

export async function markRecipientSent(id: string): Promise<void> {
  await query(
    `UPDATE employee_survey_recipients SET sent_at = COALESCE(sent_at, now())
      WHERE id = $1`,
    [id]
  );
}

export async function markRecipientCompleted(id: string): Promise<void> {
  await query(
    `UPDATE employee_survey_recipients SET completed_at = now()
      WHERE id = $1 AND completed_at IS NULL`,
    [id]
  );
}

export type TokenContext = {
  recipient: EmployeeSurveyRecipient;
  survey: EmployeeSurvey;
};

/** Resolve a survey link: the recipient row plus its survey. */
export async function getByToken(token: string): Promise<TokenContext | null> {
  const rows = await query<EmployeeSurveyRecipient>(
    `SELECT * FROM employee_survey_recipients WHERE token = $1 LIMIT 1`,
    [token]
  );
  const recipient = rows[0];
  if (!recipient) return null;
  const survey = await getSurveyById(recipient.survey_id);
  if (!survey) return null;
  return { recipient, survey };
}

/* ---------------- responses ---------------- */

export async function submitResponse(input: {
  survey: EmployeeSurvey;
  recipient: EmployeeSurveyRecipient;
  answers: Record<string, unknown>;
  comment?: string | null;
}): Promise<EmployeeSurveyResponse> {
  const ratings = input.survey.questions
    .filter((q) => q.type === "rating")
    .map((q) => Number(input.answers[q.key]))
    .filter((n) => Number.isFinite(n) && n > 0);
  const sentiment = computeSentiment(ratings);

  const rows = await query<EmployeeSurveyResponse>(
    `INSERT INTO employee_survey_responses
       (survey_id, employee_id, answers, comment, sentiment)
     VALUES ($1, $2, $3::jsonb, $4, $5)
     RETURNING *`,
    [
      input.survey.id,
      // Anonymity is enforced here: a named survey links the response back to the
      // employee; an anonymous one never records who it was.
      input.survey.anonymous ? null : input.recipient.employee_id,
      JSON.stringify(input.answers ?? {}),
      (input.comment ?? "").trim() || null,
      sentiment,
    ]
  );
  await markRecipientCompleted(input.recipient.id);
  return rows[0];
}

export type ReadableResponse = {
  id: string;
  answers: Record<string, unknown>;
  comment: string | null;
  sentiment: Sentiment | null;
  submitted_at: string;
  /** Present only on named surveys; null when anonymous. */
  employee_name: string | null;
};

/** Responses for a survey, with the employee name only when not anonymous. */
export async function listResponses(
  surveyId: string
): Promise<ReadableResponse[]> {
  return query<ReadableResponse>(
    `SELECT r.id, r.answers, r.comment, r.sentiment, r.submitted_at,
            e.name AS employee_name
       FROM employee_survey_responses r
       LEFT JOIN employees e ON e.id = r.employee_id
      WHERE r.survey_id = $1
      ORDER BY r.submitted_at DESC`,
    [surveyId]
  );
}

export type SurveySummary = {
  sent: number;
  completed: number;
  responseRate: number | null;
  responses: number;
  positive: number;
  concern: number;
  /** Mean 1..5 per rating question key (null when never answered). */
  ratingAverages: Record<string, number | null>;
};

export async function getSurveySummary(surveyId: string): Promise<SurveySummary> {
  const survey = await getSurveyById(surveyId);
  const recip = await query<{ sent: string; completed: string }>(
    `SELECT COUNT(*) FILTER (WHERE sent_at IS NOT NULL)      AS sent,
            COUNT(*) FILTER (WHERE completed_at IS NOT NULL) AS completed
       FROM employee_survey_recipients WHERE survey_id = $1`,
    [surveyId]
  );
  const responses = await query<EmployeeSurveyResponse>(
    `SELECT * FROM employee_survey_responses WHERE survey_id = $1`,
    [surveyId]
  );

  const sent = Number(recip[0]?.sent ?? 0);
  const completed = Number(recip[0]?.completed ?? 0);
  const ratingKeys = (survey?.questions ?? [])
    .filter((q) => q.type === "rating")
    .map((q) => q.key);

  const ratingAverages: Record<string, number | null> = {};
  for (const key of ratingKeys) {
    const vals = responses
      .map((r) => Number(r.answers?.[key]))
      .filter((n) => Number.isFinite(n) && n > 0);
    ratingAverages[key] = vals.length
      ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
      : null;
  }

  return {
    sent,
    completed,
    responseRate: sent > 0 ? completed / sent : null,
    responses: responses.length,
    positive: responses.filter((r) => r.sentiment === "positive").length,
    concern: responses.filter((r) => r.sentiment === "concern").length,
    ratingAverages,
  };
}
